import { notFound } from "next/navigation";
import { getSpec } from "@/lib/bulk/specs";
import type { SectionMeta } from "@/lib/bulk/types";
import ImportClient from "../ImportClient";

export default async function SectionImportPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const spec = getSpec(section);
  if (!spec) notFound();

  const meta: SectionMeta = {
    key: spec.key,
    title: spec.title,
    description: spec.description,
    columns: spec.columns.map((c) => ({
      key: c.key,
      header: c.header,
      required: c.required,
    })),
  };

  return <ImportClient meta={meta} />;
}
