import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { PageTemplate } from "./components/page-template";
import { ProfileForm } from "./components/profile-form";

function RootLayout() {
  const links = [
    { to: "/", label: "Home" },
    { to: "/search", label: "Search" },
    { to: "/subscriptions/new", label: "New Subscription" },
    { to: "/settings", label: "Settings" },
    { to: "/admin", label: "Admin" },
  ] as const;

  return (
    <main className="app-shell">
      <header className="header card">
        <h1>SubTrack Client</h1>
        <nav>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="nav-link"
              activeProps={{ className: "nav-link nav-link-active" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <Outlet />
    </main>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <PageTemplate
      title="Home"
      description="Client foundation is ready. Start migrating feature screens here."
    />
  ),
});

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: () => <PageTemplate title="Calendar" description="Calendar screen placeholder." />, 
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: () => <PageTemplate title="Search" description="Search screen placeholder." />,
});

const searchAllRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search/all",
  component: () =>
    <PageTemplate
      title="Search All"
      description="Grid marketplace screen placeholder."
    />,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => <PageTemplate title="Profile" description="Profile screen placeholder." />,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => <PageTemplate title="Settings" description="Settings root placeholder." />,
});

const settingsPaymentMethodsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/payment-methods",
  component: () =>
    <PageTemplate
      title="Payment Methods"
      description="Payment methods settings placeholder."
    />,
});

const settingsProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/profile",
  component: ProfileForm,
});

const settingsSecurityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings/security",
  component: () =>
    <PageTemplate
      title="Security"
      description="Password and security settings placeholder."
    />,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: () =>
    <PageTemplate
      title="Notifications"
      description="Notifications screen placeholder."
    />,
});

const subscriptionsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/subscriptions/new",
  component: () =>
    <PageTemplate
      title="New Subscription"
      description="Create subscription form placeholder."
    />,
});

const subscriptionsPendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/subscriptions/pending",
  component: () =>
    <PageTemplate
      title="Pending Subscriptions"
      description="Pending subscriptions placeholder."
    />,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => <PageTemplate title="Admin" description="Admin dashboard placeholder." />,
});

const adminModerationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/moderation",
  component: () =>
    <PageTemplate
      title="Moderation"
      description="Admin moderation queue placeholder."
    />,
});

const adminPublishedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/published",
  component: () =>
    <PageTemplate
      title="Published"
      description="Admin published subscriptions placeholder."
    />,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/users",
  component: () => <PageTemplate title="Users" description="Admin users screen placeholder." />,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  calendarRoute,
  searchRoute,
  searchAllRoute,
  profileRoute,
  settingsRoute,
  settingsPaymentMethodsRoute,
  settingsProfileRoute,
  settingsSecurityRoute,
  notificationsRoute,
  subscriptionsNewRoute,
  subscriptionsPendingRoute,
  adminRoute,
  adminModerationRoute,
  adminPublishedRoute,
  adminUsersRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
