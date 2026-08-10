import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Fade } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

const carouselItems = [
  {
    image:
      "https://cdn.pixabay.com/photo/2020/12/10/20/40/color-5821297_1280.jpg",
    subtitle: "MODERN LEARNING",
    title: "Explore Our Classrooms",
    description:
      "Engaging and inspiring environments crafted for every student’s success.",
  },
  {
    image:
      "https://cdn.pixabay.com/photo/2017/10/10/00/03/child-2835430_1280.jpg",
    subtitle: "STUDENT GROWTH",
    title: "Empowering Minds",
    description:
      "We believe in fostering unique potential and curiosity in each child.",
  },
  {
    image:
      "https://cdn.pixabay.com/photo/2019/09/03/01/51/child-4448370_1280.jpg",
    subtitle: "RESOURCES & TOOLS",
    title: "Advanced Learning Tools",
    description:
      "Providing world-class tools and structured guidance for effective education.",
  },
];

export default function Carousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Optional: Auto-slide effect every 6 seconds for a dynamic feel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % carouselItems.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % carouselItems.length);
  };

  const handleBack = () => {
    setActiveIndex((prev) =>
      prev === 0 ? carouselItems.length - 1 : prev - 1,
    );
  };

  const currentItem = carouselItems[activeIndex];

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        maxWidth: "100%",
        height: "520px",
        overflow: "hidden",
        backgroundColor: "#0F172A",
      }}>
      {/* Background Image Layer with Crossfade */}
      {carouselItems.map((item, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            inset: 0,
            opacity: index === activeIndex ? 1 : 0,
            transition: "opacity 1s ease-in-out",
            backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.85) 30%, rgba(15, 23, 42, 0.3) 100%), url(${item.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}

      {/* Content Container (Split/Left Aligned Modern Layout) */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          px: { xs: 4, md: 10 },
          maxWidth: "800px",
          zIndex: 2,
        }}>
        <Fade in={true} key={activeIndex} timeout={800}>
          <Box>
            {/* Subtitle Accent */}
            <Typography
              variant="overline"
              sx={{
                color: "#38BDF8",
                fontWeight: 700,
                letterSpacing: "2px",
                display: "block",
                mb: 1,
              }}>
              {currentItem.subtitle}
            </Typography>

            {/* Main Title */}
            <Typography
              variant="h3"
              sx={{
                color: "#FFFFFF",
                fontWeight: 800,
                letterSpacing: "-1px",
                mb: 2,
                fontSize: { xs: "2rem", md: "3.25rem" },
                lineHeight: 1.2,
              }}>
              {currentItem.title}
            </Typography>

            {/* Description */}
            <Typography
              variant="body1"
              sx={{
                color: "#94A3B8",
                fontSize: { xs: "1rem", md: "1.15rem" },
                maxWidth: "600px",
                mb: 4,
                lineHeight: 1.6,
              }}>
              {currentItem.description}
            </Typography>
          </Box>
        </Fade>

        {/* Indicators & Navigation Controls Row */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* Circular Navigation Buttons */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <IconButton
              onClick={handleBack}
              sx={{
                color: "#FFF",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "primary.main",
                  borderColor: "primary.main",
                },
              }}>
              <ArrowBackIosNewRoundedIcon fontSize="small" />
            </IconButton>

            <IconButton
              onClick={handleNext}
              sx={{
                color: "#FFF",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "primary.main",
                  borderColor: "primary.main",
                },
              }}>
              <ArrowForwardIosRoundedIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Minimalist Line Indicators */}
          <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
            {carouselItems.map((_, idx) => (
              <Box
                key={idx}
                onClick={() => setActiveIndex(idx)}
                sx={{
                  width: idx === activeIndex ? "36px" : "12px",
                  height: "4px",
                  borderRadius: "2px",
                  backgroundColor:
                    idx === activeIndex
                      ? "#38BDF8"
                      : "rgba(255, 255, 255, 0.3)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
