import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/launches")({
  component: LaunchesLayout,
});

function LaunchesLayout() {
  return (
    <div className="contents">
      <Outlet />
    </div>
  );
}
