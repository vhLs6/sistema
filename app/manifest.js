export default function manifest() {
  return {
    name: "Challenge Rounds",
    short_name: "Rounds",
    description: "A group challenge game with rounds, rewards, and secret challenges.",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    background_color: "#101113",
    theme_color: "#101113",
    orientation: "any",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  };
}
