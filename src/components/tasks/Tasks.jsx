import { useContext, useState, useEffect } from "react";
import styles from "@/styles/tasks.module.scss";
import { nanoid } from "nanoid";
import Scrollbar from "react-scrollbars-custom";
import { When } from "react-if";

import TasksRoot from "@/src/components/tasks/TasksRoot";

import { TasksContext } from "@/src//context/tasks/TasksContext";
import { ProjectsContext } from "@/src//context/projects/ProjectsContext";
import { UsersContext } from "@/src/context/users/UsersContext";

export default function Tasks({
  editedTask,
  setEditedTask,
  isSubtasksOpened,
  setIsSubtasksOpened,
}) {
  const userCtx = useContext(UsersContext);

  const [containerHeight, setContainerHeight] = useState(0);
  const { tasks, createTask, tasksByProjectId } = useContext(TasksContext);
  const { projectByQueryId } = useContext(ProjectsContext);
  let filtredTasks;
  if (projectByQueryId.owner == userCtx._id) {
    filtredTasks = tasks.filter((task) => task.project == projectByQueryId._id);
  } else {
    filtredTasks = tasksByProjectId;
  }

  useEffect(() => {
    if (!filtredTasks.length) {
      setContainerHeight(0);
    }
  }, [filtredTasks]);

  const createHandle = async () => {
    const today = new Date();
    const currentDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0
    );
    let afterWeek = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 6,
      23,
      59,
      59
    );

    const topLevelTasks = tasks.filter(
      (task) => !task.root && task.project == projectByQueryId._id
    );

    await createTask({
      _id: nanoid(),
      name: "",
      description: "",
      dateStart: currentDate,
      dateEnd: afterWeek,
      color: "258EFA",
      project: projectByQueryId._id,
      root: "",
      order: topLevelTasks.length,
    });
  };

  return (
    <>
      <div className={styles.line}></div>
      <div className={styles.tasksHeaderWrapper}>
        <div className={styles.tasksHeader}>TASK NAME</div>
      </div>
      <div className={styles.line}></div>
      <Scrollbar
        style={{ height: containerHeight }}
        noScrollX={true}
        className={styles.tasksRoot}
        trackYProps={{
          renderer: (props) => {
            const { elementRef, ...restProps } = props;
            return (
              <span
                {...restProps}
                ref={elementRef}
                className="ScrollbarsCustom-Track ScrollbarsCustom-TrackY ScrollbarsCustom-Tasks"
              />
            );
          },
        }}
      >
        <TasksRoot
          root={""}
          setContainerHeight={setContainerHeight}
          editedTask={editedTask}
          setEditedTask={setEditedTask}
          isSubtasksOpened={isSubtasksOpened}
          setIsSubtasksOpened={setIsSubtasksOpened}
        />
      </Scrollbar>
      <When condition={projectByQueryId.owner == userCtx._id}>
        <div className={styles.newTaskBtn} onClick={createHandle}>
          + New Task
        </div>
      </When>
    </>
  );
}