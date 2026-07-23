import { Route as rootRouteImport } from "./routes/__root";
import { Route as LandingRouteImport } from "./routes/landing";
import { Route as ContactsRouteImport } from "./routes/contacts";
import { Route as MeetingsRouteImport } from "./routes/meetings";
import { Route as LeadsRouteImport } from "./routes/leads";
import { Route as ServicesRouteImport } from "./routes/services";
import { Route as DealsRouteImport } from "./routes/deals";
import { Route as CompaniesRouteImport } from "./routes/companies";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as ProposalsIndexRouteImport } from "./routes/proposals.index";
import { Route as ProposalsTemplatesRouteImport } from "./routes/proposals.templates";
import { Route as ProposalsNewRouteImport } from "./routes/proposals.new";

const LandingRoute = LandingRouteImport.update({
  id: "/landing",
  path: "/landing",
  getParentRoute: () => rootRouteImport,
});
const ContactsRoute = ContactsRouteImport.update({
  id: "/contacts",
  path: "/contacts",
  getParentRoute: () => rootRouteImport,
});
const MeetingsRoute = MeetingsRouteImport.update({
  id: "/meetings",
  path: "/meetings",
  getParentRoute: () => rootRouteImport,
});
const LeadsRoute = LeadsRouteImport.update({
  id: "/leads",
  path: "/leads",
  getParentRoute: () => rootRouteImport,
});
const ServicesRoute = ServicesRouteImport.update({
  id: "/services",
  path: "/services",
  getParentRoute: () => rootRouteImport,
});
const DealsRoute = DealsRouteImport.update({
  id: "/deals",
  path: "/deals",
  getParentRoute: () => rootRouteImport,
});
const CompaniesRoute = CompaniesRouteImport.update({
  id: "/companies",
  path: "/companies",
  getParentRoute: () => rootRouteImport,
});
const IndexRoute = IndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => rootRouteImport,
});
const ProposalsIndexRoute = ProposalsIndexRouteImport.update({
  id: "/proposals/",
  path: "/proposals/",
  getParentRoute: () => rootRouteImport,
});
const ProposalsTemplatesRoute = ProposalsTemplatesRouteImport.update({
  id: "/proposals/templates",
  path: "/proposals/templates",
  getParentRoute: () => rootRouteImport,
});
const ProposalsNewRoute = ProposalsNewRouteImport.update({
  id: "/proposals/new",
  path: "/proposals/new",
  getParentRoute: () => rootRouteImport,
});

const rootRouteChildren = {
  IndexRoute: IndexRoute,
  LandingRoute: LandingRoute,
  ContactsRoute: ContactsRoute,
  MeetingsRoute: MeetingsRoute,
  CompaniesRoute: CompaniesRoute,
  DealsRoute: DealsRoute,
  LeadsRoute: LeadsRoute,
  ServicesRoute: ServicesRoute,
  ProposalsNewRoute: ProposalsNewRoute,
  ProposalsTemplatesRoute: ProposalsTemplatesRoute,
  ProposalsIndexRoute: ProposalsIndexRoute,
};

export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren);
