import { createFileRoute } from "@tanstack/react-router";
import { ImprovementDemo, improvementMeta } from "../improvement";

export const Route = createFileRoute("/")({
  head: () => ({ meta: improvementMeta }),
  component: ImprovementDemo,
});
