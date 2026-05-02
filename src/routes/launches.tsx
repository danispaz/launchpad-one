import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/launches")({
  component: LaunchesLayout,
});

function LaunchesLayout() {
  console.log('LAUNCHES LAYOUT MOUNTED');
  return <Outlet />;
}
