// Define presets de layout (regiões/slots e algumas regras leves)

window.PRESETS = {
  TopHeaderFixed: {
    id: "TopHeaderFixed",
    regions: ["header", "toolbar", "content", "footer"],
    rules: { headerFixed: true, contentMaxWidth: 1280 }
  },
  TopHeaderFixedLeftNav: {
    id: "TopHeaderFixedLeftNav",
    regions: ["header", "leftnav", "toolbar", "content", "footer"],
    rules: { headerFixed: true, leftNavWidth: 260, contentMaxWidth: 1280 }
  }
};

window.DEFAULT_PRESET = "TopHeaderFixed";
