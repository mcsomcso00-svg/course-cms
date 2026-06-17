import TutorForm from "../TutorForm";
import { createTutor } from "../actions";

export default function NewTutorPage() {
  return <TutorForm action={createTutor} title="創建導師" />;
}
