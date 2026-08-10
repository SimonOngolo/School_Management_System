import * as React from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Modal,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  Fade,
  Backdrop,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { baseApi } from "../../../../environment";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SchoolIcon from "@mui/icons-material/School";

export default function Gallery() {
  const [open, setOpen] = React.useState(false);
  const [selectedSchool, setSelectedSchool] = React.useState(null);
  const [schools, setSchools] = React.useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleOpen = (school) => {
    setSelectedSchool(school);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSchool(null);
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "90%", sm: "80%", md: 650 },
    bgcolor: "background.paper",
    borderRadius: 4,
    boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
    p: 3,
    outline: "none",
    overflow: "hidden",
  };

React.useEffect(() => {
  axios
    .get(`${baseApi}/school/all`)
    .then((resp) => {
      setSchools(resp.data.data || []);
    })
    .catch((e) => {
      console.error("Error fetching schools:", e);
    });
}, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 4 }, py: 6 }}>
      {/* Section Header */}
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 1.5,
            boxShadow: "0 8px 16px rgba(25, 118, 210, 0.3)",
          }}>
          <SchoolIcon sx={{ color: "#fff", fontSize: 24 }} />
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: 800, color: "#1E293B", letterSpacing: "-0.5px" }}>
          Registered Schools
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
          Explore our network of trusted institutions
        </Typography>
      </Box>

      {/* Image Grid */}
      <ImageList
        cols={isMobile ? 1 : 3}
        gap={24}
        sx={{
          overflow: "hidden",
          mb: 0,
          "& .MuiImageListItem-root": {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            transition: "all 0.3s ease-in-out",
            backgroundColor: "#F8FAFC",
            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow: "0 16px 32px rgba(0,0,0,0.12)",
              "& img": {
                transform: "scale(1.05)",
              },
            },
          },
        }}>
        {schools.map((item) => (
          <ImageListItem
            key={item._id || item.school_image}
            sx={{ cursor: "pointer" }}>
            <Box sx={{ width: "100%", height: 260, overflow: "hidden" }}>
              <img
                src={`./images/uploaded/schools/${item.school_image}`}
                alt={item.school_name}
                loading="lazy"
                onClick={() => handleOpen(item)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.5s ease",
                }}
              />
            </Box>
            <ImageListItemBar
              title={item.school_name}
              subtitle={item.location || "Verified Institution"}
              sx={{
                background:
                  "linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.4) 70%, transparent 100%)",
                "& .MuiImageListItemBar-title": {
                  fontWeight: 700,
                  fontSize: "1rem",
                },
                "& .MuiImageListItemBar-subtitle": {
                  fontSize: "0.8rem",
                  color: "#94A3B8",
                },
              }}
              actionIcon={
                <IconButton
                  sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                  aria-label={`info about ${item.school_name}`}
                  onClick={() => handleOpen(item)}>
                  <InfoOutlinedIcon />
                </IconButton>
              }
            />
          </ImageListItem>
        ))}
      </ImageList>

      {/* Modern Detail Modal */}
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: {
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(6px)",
            },
          },
        }}>
        <Fade in={open}>
          <Box sx={modalStyle}>
            {selectedSchool && (
              <>
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{
                    fontWeight: 800,
                    color: "#1E293B",
                    mb: 2,
                    letterSpacing: "-0.5px",
                  }}>
                  {selectedSchool.school_name}
                </Typography>

                <Box
                  sx={{
                    width: "100%",
                    height: { xs: 280, sm: 380 },
                    borderRadius: 2,
                    overflow: "hidden",
                    backgroundColor: "#F8FAFC",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.06)",
                  }}>
                  <img
                    src={`./images/uploaded/schools/${selectedSchool.school_image}`}
                    alt={selectedSchool.school_name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}
