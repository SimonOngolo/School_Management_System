import React, { useContext } from "react";
import { IconButton, useTheme } from "@mui/material";
import { ColorModeContext } from "./ThemeContext"; // Adjust path accordingly
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

export default function DarkModeToggle() {
  const theme = useTheme();
  const { toggleColorMode } = useContext(ColorModeContext);

  return (
    <IconButton
      onClick={toggleColorMode}
      color="inherit"
      aria-label="toggle dark/light mode"
      sx={{
        ml: 1,
        borderRadius: 2,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.1)",
        },
      }}>
      {theme.palette.mode === "dark" ? (
        <Brightness7Icon />
      ) : (
        <Brightness4Icon />
      )}
    </IconButton>
  );
}
