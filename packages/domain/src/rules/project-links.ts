import type { Project, ProjectLinks } from "../entities/project";

/**
 * The links to show for a project. Once a project is offline, its website and store links are
 * hidden: an expired domain can be bought by someone else, and the old link would then send
 * visitors to whatever they host. The repository and the archived copy stay useful.
 */
export function visibleLinks(project: Project): ProjectLinks {
  if (project.offlineSince === null) {
    return project.links;
  }
  return { ...project.links, website: null, mobileApp: null };
}
