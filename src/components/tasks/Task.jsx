import { useState, useContext, useEffect, useRef } from "react";
import { When } from "react-if";

import TasksRoot from "@/src/components/tasks/TasksRoot";
import TaskWrapper from "@/src/components/tasks/Task/TaskWrapper";
import VerticalLine from "@/src/components/tasks/Task/VerticalLine";
import SubtasksArrow from "@/src/components/tasks/Task/SubtasksArrow";
import Name from "@/src/components/tasks/Task/Name";
import Pencil from "@/src/components/tasks/Task/Pencil";
import Plus from "@/src/components/tasks/Task/Plus";

import { TasksContext } from "@/src/context/TasksContext";

const taskHeight = 55;

export default function Task({ task, setContainerHeight, index }) {
  const { tasksByProjectId, isTaskOpened } = useContext(TasksContext);

  const subtasks = tasksByProjectId.filter(
    (subtask) => subtask.root == task._id
  );

  const fakeText = useRef(null);
  const arrow = useRef(null);
  const plus = useRef(null);
  const pencil = useRef(null);

  const [isUpdating, setUpdatingState] = useState(false);

  const getContainerHeight = () =>
    document.querySelectorAll(".task").length * taskHeight;

  useEffect(() => {
    setContainerHeight(getContainerHeight());
  }, [tasksByProjectId, isTaskOpened[task._id]]);

  let taskDepth = -1;
  let currentTask = task;
  while (currentTask) {
    currentTask = tasksByProjectId.find((t) => t._id == currentTask.root);
    taskDepth += 1;
  }

  return (
    <>
      <TaskWrapper
        task={task}
        setUpdatingState={setUpdatingState}
        arrow={arrow}
        plus={plus}
        pencil={pencil}
        index={index}
        taskDepth={taskDepth}
      >
        <VerticalLine task={task} />

        <SubtasksArrow task={task} arrow={arrow} taskDepth={taskDepth} />

        <Name
          task={task}
          isUpdating={isUpdating}
          setUpdatingState={setUpdatingState}
          fakeTextRef={fakeText}
          taskDepth={taskDepth}
        />

        <Pencil
          task={task}
          fakeTextRef={fakeText}
          pencilRef={pencil}
          isUpdating={isUpdating}
          taskDepth={taskDepth}
        />

        <Plus task={task} plusRef={plus} />
      </TaskWrapper>

      <When condition={subtasks.length && isTaskOpened[task._id]}>
        <TasksRoot root={task._id} setContainerHeight={setContainerHeight} />
      </When>
    </>
  );
}
