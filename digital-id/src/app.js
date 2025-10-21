import * as UI from './ui.js'
import * as Geo from './geo.js'
import * as Data from './data.js'
import * as MapMod from './map.js'

export async function start(cfg){
  UI.initTopbar(cfg.title)

  const world = await Geo.loadWorld()
  if(!world){ console.error('World polygons failed to load'); return }

  const centroids = Geo.buildCentroids(world)

  const csvText = await Data.fetchCsvOrFallback(cfg.sheetCsv)
  UI.setUpdated(Data.updatedAt())

  const rows = Data.parseCsv(csvText)
  const entries = Data.normalize(rows, centroids, cfg, Geo.normalizeCountry)

  const map = MapMod.init()
  MapMod.draw({ world, entries, centroids, cfg, map })
}
