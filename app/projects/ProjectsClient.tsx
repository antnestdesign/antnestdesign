"use client";

import ProjectsDesktop from "./ProjectsDesktop";
import ProjectsMobile from "./ProjectsMobile";

export default function ProjectsClient() {
  return (
    <>
      <div className="hidden lg:block">
        <ProjectsDesktop />
      </div>

      <div className="block lg:hidden">
        <ProjectsMobile />
      </div>
    </>
  );
}