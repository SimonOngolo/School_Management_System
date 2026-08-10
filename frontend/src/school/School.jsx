import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useNavigate, useLocation, Outlet } from "react-router-dom";

// Icons
import HomeIcon from "@mui/icons-material/Home";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import PeopleIcon from "@mui/icons-material/People";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EventIcon from "@mui/icons-material/Event";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SubjectIcon from "@mui/icons-material/Subject";
import ExplicitIcon from "@mui/icons-material/Explicit";
import RecentActorsIcon from "@mui/icons-material/RecentActors";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 240;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open
    ? { ...openedMixin(theme), "& .MuiDrawer-paper": openedMixin(theme) }
    : { ...closedMixin(theme), "& .MuiDrawer-paper": closedMixin(theme) }),
}));

export default function School() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navArr = [
    { link: "/", component: "Home", icon: HomeIcon },
    { link: "/school", component: "Dashboard", icon: DashboardCustomizeIcon },
    { link: "/school/class", component: "Class", icon: FormatListNumberedIcon },
    {
      link: "/school/attendance",
      component: "Attendance",
      icon: RecentActorsIcon,
    },
    { link: "/school/students", component: "Students", icon: PeopleIcon },
    { link: "/school/subject", component: "Subjects", icon: SubjectIcon },
    { link: "/school/teachers", component: "Teachers", icon: PeopleAltIcon },
    { link: "/school/fees", component: "School Fees", icon: RequestQuoteIcon },
    { link: "/school/notice", component: "Notice", icon: NotificationsIcon },
    {
      link: "/school/examinations",
      component: "Examinations",
      icon: ExplicitIcon,
    },
    { link: "/school/schedule", component: "Schedule", icon: EventIcon },
    { link: "/logout/", component: "Log Out", icon: LogoutIcon },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open} sx={{ backgroundColor: "#1e293b" }}>
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={() => setOpen(true)}
            sx={{ mr: 2, ...(open && { display: "none" }) }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
            School Management System
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <IconButton onClick={() => setOpen(false)}>
            {theme.direction === "rtl" ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List sx={{ px: 1, mt: 1 }}>
          {navArr.map((navItem) => {
            const Icon = navItem.icon;
            const isSelected = location.pathname === navItem.link;
            return (
              <ListItem
                key={navItem.component}
                disablePadding
                sx={{ display: "block", mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    if (navItem.component === "School Fees") {
                      window.location.href = `${window.location.protocol}//${window.location.hostname}:5174/school`;
                    } else {
                      navigate(navItem.link);
                    }
                  }}
                  sx={[
                    {
                      minHeight: 48,
                      borderRadius: "12px",
                      transition: "all 0.2s",
                    },
                    open ? { px: 2.5 } : { justifyContent: "center", px: 2.5 },
                    isSelected && {
                      backgroundColor: "rgba(25, 118, 210, 0.1) !important",
                      "& .MuiListItemIcon-root": {
                        color: theme.palette.primary.main,
                      },
                    },
                  ]}>
                  <ListItemIcon
                    sx={[
                      { minWidth: 0, justifyContent: "center" },
                      open ? { mr: 3 } : { mr: "auto" },
                    ]}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={navItem.component}
                    sx={[open ? { opacity: 1 } : { opacity: 0 }]}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
        }}>
        <DrawerHeader />
        <Outlet />
      </Box>
    </Box>
  );
}
