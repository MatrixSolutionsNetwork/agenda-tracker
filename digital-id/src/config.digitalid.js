export default {
  title: "Digital ID Status",
  sheetCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSsoZwmLz701G4Q5zFjGsL_RO8yjfxe4jY0woh-YL_-ATX6Mc4Rzxf3cSP7LzLN9OCt5Is_s1FHHAWs/pub?gid=0&single=true&output=csv",
  colors: {
    implemented: "#ff3333",
    inDev: "#ff9900",
    shadeFill: "#ff3333",
    matrix: "#21ff9d",
  },
  fields: {
    title: "Title",
    status: "Status",
    desc: "Description",
    year: "Year",
    countries: "Countries",
    source: "Source"
  },
  regex: {
    impl: /implement/i,
    dev: /(develop|discussion|pilot|trial|poc|concept)/i
  }
}
