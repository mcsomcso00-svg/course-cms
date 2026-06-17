import SchoolForm from "../SchoolForm";
import { createSchool } from "../actions";

export default function NewSchoolPage() {
  return <SchoolForm action={createSchool} title="新增學校" />;
}
