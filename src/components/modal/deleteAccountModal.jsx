import styles from "@/styles/deleteAccount.module.scss";
import Router from "next/router";
import { useContext } from "react";

import { ProjectsContext } from "@/src/context/ProjectsContext";
import { TasksContext } from "@/src/context/TasksContext";
import { UsersContext } from "@/src/context/UsersContext";
import Cookies from "js-cookie";

export default function DeleteAccountModal({ setModal }) {
  const { deleteAllProjects } = useContext(ProjectsContext);
  const { deleteAllTasks } = useContext(TasksContext);
  const { deleteUser } = useContext(UsersContext);

  const outsideClick = (e) => {
    if (e.target.id === "delete_account_wrapper") {
      setModal(false);
    }
  };

  const deleteQuery = async () => {
    try {
      await Promise.all([deleteAllTasks(), deleteAllProjects()]);
      await deleteUser();
      Cookies.remove("ganttToken", { path: "/" });
      Router.push("/signup");
    } catch (e) {}
  };

  return (
    <>
      <div className={styles.modalBlock} />
      <div
        className={styles.modalWrap}
        onClick={outsideClick}
        id="delete_account_wrapper"
      >
        <div className={styles.deleteAccountModal}>
          <div>
            <div className={styles.deleteAccountTitle}>Delete account</div>
            <div className={styles.deleteAccountDescription}>
              Are you sure you want to <br />
              delete your account?
            </div>
            <div className={styles.twoButtons}>
              <div
                className={styles.deleteAccountSecondaryButton}
                onClick={setModal.bind(null, "account")}
              >
                No
              </div>
              <div
                className={styles.deleteAccountPrimaryButton}
                onClick={deleteQuery}
              >
                Yes
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
