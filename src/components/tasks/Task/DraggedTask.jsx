import { useState, useContext, useEffect, useRef } from "react";
import styles from "@/styles/tasks.module.scss";
import { When } from "react-if";
import Truncate from "react-truncate";
import useEvent from "@react-hook/event";
import anime from "animejs";

import TaskWrapper from "@/src/components/tasks/Task/TaskWrapper";

import { UsersContext } from "@/src/context/UsersContext";
import { ProjectsContext } from "@/src/context/ProjectsContext";
import { TasksContext } from "@/src/context/TasksContext";

export default function DraggedTask({
  children,
  task,
  editedTaskId,
  setUpdatingState,
  arrow,
  plus,
  pencil,
}) {
  const { tasks, updateTask, tasksByProjectId, updateIsOpened } = useContext(
    TasksContext
  );
  const { projectByQueryId } = useContext(ProjectsContext);
  const userCtx = useContext(UsersContext);

  //drag code
  const draggedTask = useRef(null);
  const [isDragging, setDraggingState] = useState(false);
  const [scrollingSpeed, setScrollingSpeed] = useState(0);
  const [scrollingTimer, setScrollingTimer] = useState(null);
  const [initialMousePosition, setInitialMousePisition] = useState({
    shiftX: 0,
    shiftY: 0,
  });
  const [sourceTask, setSourceTask] = useState(null);
  const [beforeTask, setBeforeTask] = useState(null);
  const [afterTask, setAfterTask] = useState(null);

  const subtasks = tasksByProjectId
    .filter((subtask) => subtask.root == task._id)
    .sort((task1, task2) => task1.order > task2.order);

  const reorderHandler = () => {};

  const isUserOwnProject = () => projectByQueryId.owner == userCtx._id;

  const addInitialClasses = (e) => {
    const taskElements = Array.from(document.querySelectorAll(".task"));
    if (taskElements.length > 1) {
      taskElements.forEach((el, i) => {
        if (el.getBoundingClientRect().top > e.clientY) {
          el.classList.add("plus55");
        }
        setTimeout(() => {
          el.classList.add("animTranslateY");
        }, 100);
      });

      if (e.target.classList.contains(`task-${task._id}`)) {
        if (
          taskElements[taskElements.length - 1].classList.contains(
            `task-${task._id}`
          )
        ) {
          setTimeout(() => {
            taskElements[taskElements.length - 2].classList.add("mb55");
          }, 100);
        } else {
          taskElements[taskElements.length - 1].classList.add("mb55");
        }
      }
    }
  };

  const getTaskFromDomElement = (el) => {
    el.classList.forEach((cl) => {
      if (cl.startsWith("task-")) {
        return tasks.find((t) => t._id == cl.slice(5));
      }
    });
  };

  const addAnimationClassesAndSetTasks = () => {
    draggedTask.current.style.transitionDuration = "0.2s";

    let beforeTasks = [];
    const taskElements = document.querySelectorAll(".task");
    taskElements.forEach((el, i) => {
      const currentTask = getTaskFromDomElement(el);
      if (
        el.getBoundingClientRect().top >
        draggedTask.current.getBoundingClientRect().top
      ) {
        el.classList.add("plus55");
      } else {
        if (!el.classList.contains("hidden")) {
          beforeTasks.push(currentTask);
        }
        el.classList.remove("plus55");
      }
    });

    if (beforeTasks.length) {
      setBeforeTask(beforeTasks[beforeTasks.length - 1]);
    } else {
      setBeforeTask(null);
    }
  };

  const getCurrenRoot = () => {
    if (beforeTask) {
      if (beforeTask.root != sourceTask.root) {
        if (afterTask) {
          if (afterTask.order == 0 || afterTask.order == 1) {
            return afterTask.root;
          }
          return beforeTask.root;
        }
        return beforeTask.root;
      } else if (
        afterTask &&
        afterTask.order == 0 &&
        afterTask.root != sourceTask.root
      ) {
        return afterTask.root;
      }
    } else if (afterTask) {
      if (afterTask.root != sourceTask.root) {
        return afterTask.root;
      }
    }
    return sourceTask.root;
  };

  const changeStylesForDraggedTask = () => {
    const currentRoot = getCurrenRoot();
    let taskDepth = -1;
    let currentTask = tasksByProjectId.find((t) => t.root == currentRoot);
    while (currentTask) {
      currentTask = tasksByProjectId.find((t) => t._id == currentTask.root);
      taskDepth += 1;
    }
    draggedTask.current.style.paddingLeft = 33 + 14 * taskDepth + "px";
    if (taskDepth) {
      draggedTask.current.style.color = "#949da7";
    } else {
      draggedTask.current.style.color = "#696f75";
    }
  };

  useEffect(() => {
    if (draggedTask.current) {
      changeStylesForDraggedTask();
    }
  }, [afterTask, beforeTask, sourceTask]);

  const addScroll = () => {
    let scrollbar = document.querySelector(".ScrollbarsCustom-Scroller");
    const scrollbarRect = scrollbar.getBoundingClientRect();
    const draggedTaskRect = draggedTask.current.getBoundingClientRect();
    if (
      scrollbarRect.bottom - draggedTaskRect.bottom < 55 &&
      draggedTaskRect.top - scrollbarRect.top > 0
    ) {
      if (scrollingSpeed <= 0) {
        clearInterval(scrollingTimer);
        setScrollingTimer(null);
        setScrollingSpeed(4);
      }
    } else if (
      draggedTaskRect.top - scrollbarRect.top < 55 &&
      draggedTaskRect.top - scrollbarRect.top > 0
    ) {
      if (scrollingSpeed >= 0) {
        clearInterval(scrollingTimer);
        setScrollingTimer(null);
        setScrollingSpeed(-4);
      }
    } else {
      clearInterval(scrollingTimer);
      setScrollingTimer(null);
      setScrollingSpeed(0);
    }
  };

  const moveClone = (e) => {
    const { shiftX, shiftY } = initialMousePosition;
    draggedTask.current.style.left = e.clientX - shiftX + "px";
    draggedTask.current.style.top = e.clientY - shiftY + "px";
  };

  const dragStartHandler = (e) => {
    if (isUserOwnProject()) {
      updateIsOpened({ _id: task._id, isOpened: false });
      setDraggingState(true);
      const taskRect = e.target.getBoundingClientRect();
      setInitialMousePisition({
        shiftX: e.clientX - taskRect.left,
        shiftY: e.clientY - taskRect.top,
      });
      addInitialClasses(e);
      setSourceTask(task);
    }
  };

  const dragEndHandler = () => {
    clearInterval(scrollingTimer);
    setScrollingTimer(null);
    setScrollingSpeed(0);

    let top;
    if (beforeTask) {
      const beforeTaskElement = document.querySelector(
        `.task-${beforeTask._id}`
      );
      top = beforeTaskElement.getBoundingClientRect().bottom;
    } else {
      top = 167;
    }
    anime({
      targets: ".draggedTask",
      top: `${top}px`,
      left: "0px",
      boxShadow: [
        "15px 15px 50px rgba(9, 40, 72, 0.1)",
        "15px 15px 50px rgba(9, 40, 72, 0)",
      ],
      easing: "easeInOutQuad",
      duration: 200,
      complete: function (anim) {
        if (beforeTask || afterTask) {
          reorderHandler();
        }
        document.querySelectorAll(".task").forEach((taskElement) => {
          taskElement.classList.remove("animTranslateY");
          taskElement.classList.remove("plus55");
          taskElement.classList.remove("mb55");
        });
        setDraggingState(false);
        setInitialMousePisition({
          shiftX: 0,
          shiftY: 0,
        });
        setSourceTask(null);
        setBeforeTask(null);
        setAfterTask(null);
      },
    });
  };

  const dragoverHandler = (e) => {
    if (isDragging) {
      moveClone(e);
      addAnimationClassesAndSetTasks();
      addScroll();
    }
  };

  useEffect(() => {
    if (scrollingSpeed) {
      setScrollingTimer(
        setInterval(() => {
          document
            .querySelector(".ScrollbarsCustom-Scroller")
            .scrollBy(0, scrollingSpeed);
        }, 10)
      );
    }
  }, [scrollingSpeed]);

  useEvent(document, "dragover", (e) => {
    dragoverHandler(e);
  });

  useEvent(
    document.querySelector(".ScrollbarsCustom-Scroller"),
    "scroll",
    (e) => {
      if (isDragging) {
        addAnimationClassesAndSetTasks();
      }
    }
  );

  return (
    <>
      {/* <When condition={isDragging}>
        <div
          ref={draggedTask}
          className={
            styles.task + ` task-${task._id} draggedTask ` + styles.dragged
          }
        >
          <When condition={editedTaskId == task._id}>
            <div className={styles.verticalLineAbsolute}></div>
          </When>
          <When condition={subtasks.length}>
            <img
              className={task.isOpened ? styles.arrowDown : styles.arrowRight}
              src={
                task.isOpened ? "/img/arrowDown.svg" : "/img/arrowRightTask.svg"
              }
              alt=" "
            />
          </When>
          <Truncate lines={1} width={230}>
            {task.name}
          </Truncate>
        </div>
      </When> */}

      <TaskWrapper
        task={task}
        setUpdatingState={setUpdatingState}
        dragStartHandler={dragStartHandler}
        dragEndHandler={dragEndHandler}
        arrow={arrow}
        plus={plus}
        pencil={pencil}
        isDragging={isDragging}
      >
        {children}
      </TaskWrapper>
    </>
  );
}

// const reorderHandler = async () => {
//   if (
//     beforeTask &&
//     beforeTask._id == sourceTask.root &&
//     (!afterTask || afterTask.order == 1)
//   ) {
//     return;
//   }
//   const oldIndex = sourceTask.order;
//   let isMoveBetweenRoots = false;
//   let newRoot;
//   let newIndex;

//   if (beforeTask) {
//     if (beforeTask.root != sourceTask.root) {
//       isMoveBetweenRoots = true;
//       if (afterTask) {
//         if (afterTask.order == 0) {
//           if (afterTask.root == sourceTask.root) {
//             isMoveBetweenRoots = false;
//             newRoot = sourceTask.root;
//             newIndex = 0;
//           } else {
//             newRoot = afterTask.root;
//             newIndex = 0;
//           }
//         } else {
//           newRoot = beforeTask.root;
//           newIndex = beforeTask.order + 1;
//         }
//       } else {
//         newRoot = beforeTask.root;
//         newIndex = beforeTask.order + 1;
//       }
//     } else if (
//       afterTask &&
//       afterTask.order == 0 &&
//       afterTask.root != sourceTask.root
//     ) {
//       isMoveBetweenRoots = true;
//       newRoot = afterTask.root;
//       newIndex = 0;
//     }
//   } else if (afterTask && !newIndex) {
//     if (afterTask.root != sourceTask.root) {
//       isMoveBetweenRoots = true;
//       newRoot = afterTask.root;
//       if (afterTask.order) {
//         newIndex = afterTask.order - 1;
//       } else {
//         newIndex = 0;
//       }
//     }
//   }

//   if (!isMoveBetweenRoots) {
//     if (beforeTask) {
//       if (
//         beforeTask.root == sourceTask.root &&
//         beforeTask.order + 1 == sourceTask.order
//       ) {
//         return;
//       }
//     }
//     if (afterTask) {
//       if (
//         afterTask.root == sourceTask.root &&
//         afterTask.order - 1 == sourceTask.order
//       ) {
//         return;
//       }
//     }

//     if (beforeTask && afterTask) {
//       if (beforeTask.root == sourceTask.root) {
//         if (beforeTask.order > oldIndex) {
//           newIndex = beforeTask.order;
//         } else {
//           newIndex = afterTask.order;
//         }
//       } else {
//         newIndex = 0;
//       }
//     } else if (!beforeTask) {
//       newIndex = 0;
//     } else if (!afterTask) {
//       newIndex = sortedTasks.length - 1;
//     }

//     if (oldIndex != newIndex) {
//       updateTask({ ...sourceTask, order: newIndex });
//       if (newIndex > oldIndex) {
//         sortedTasks.slice(oldIndex + 1, newIndex + 1).forEach((t) => {
//           updateTask({ ...t, order: t.order - 1 });
//         });
//       } else {
//         sortedTasks.slice(newIndex, oldIndex).forEach((t) => {
//           updateTask({ ...t, order: t.order + 1 });
//         });
//       }
//     }
//   } else {
//     tasksByProjectId
//       .filter((t) => t.root == sourceTask.root)
//       .sort((task1, task2) => task1.order > task2.order)
//       .slice(oldIndex + 1)
//       .forEach((t) => {
//         updateTask({ ...t, order: t.order - 1 });
//       });

//     tasksByProjectId
//       .filter((t) => t.root == newRoot)
//       .sort((task1, task2) => task1.order > task2.order)
//       .slice(newIndex)
//       .forEach((t) => {
//         updateTask({ ...t, order: t.order + 1 });
//       });
//     updateTask({ ...sourceTask, order: newIndex, root: newRoot });
//   }
// };
