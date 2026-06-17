import UserForm from "../UserForm";
import { createAdmin } from "../actions";

export default function NewUserPage() {
  return <UserForm action={createAdmin} title="創建管理員" />;
}
