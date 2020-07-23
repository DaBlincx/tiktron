const { app, BrowserWindow } = require('electron')
const path = require('path')
const tt = require('tiktok-scraper')
const ipc = require('electron').ipcMain

// App configuration

class AppConfig {}
const CONF = new AppConfig
CONF.devToolsOpen = false
CONF.devToolsOpen = true

// State initialization

class State {}
const STATE = new State()

STATE.idxCurrent  = 0
STATE.resource    = "users" // resources: users, hashtags, trending
STATE.query       = "makevoid"

// utils - extract
const mergeObjects = Object.assign

const ttOptionsDefault = { noWaterMark: true }

const transition = () => {
  console.log("starting css animation to replace video")
}

const getState = () => {
  const resource    = STATE.resource
  const query       = STATE.query
  const idxCurrent  = STATE.idxCurrent
  return { resource, query, idxCurrent }
}

const reducers = {
  updateIdx: ({ idx }) => {
    STATE.idxCurrent = idx
  },
  updateQuery: ({ resource, query }) => {
    STATE.resource = resource
    STATE.query = query
  },
}

const actions = {
  nextVideo: async () => {
    const { resource, query, idxCurrent } = getState()
    let idx = idxCurrent + 1
    const video = await loadVideo({ resource, query, idx })
    reducers.updateIdx({ idx })
    return video
  },
  prevVideo: async () => {
    const { resource, query, idxCurrent } = getState()
    let idx = idxCurrent - 1
    if (idx < 0) idx = 0
    const video = await loadVideo({ resource, query, idx })
    reducers.updateIdx({ idx })
    return video
  },
  firstVideo: async () => {
    const { resource, query } = getState()
    const idx = 0
    const video = await loadVideo({ resource, query, idx })
    return video
  },
  loadSearch: async ({ resource, query }) => {
    let idx = 0
    const video = await loadVideo({ resource, query, idx })
    reducers.updateIdx({ idx })
    reducers.updateQuery({ resource, query })
    return video
  },
}

const bindEventsIPC = () => {
  ipc.on('search', async (evt, data) => {
    const { query } = data
    const resource = "hashtags"
    const video = await actions.loadSearch({ resource, query })
    // evt.sender.send('search-reply', data)

    const { idxCurrent } = getState()
    const videoData = {
      video: video,
      state: { resource, query, idxCurrent },
    }
    evt.sender.send('load-video-reply', videoData)
  })

  ipc.on('load-video', async (evt, data) => {
    // TODO: refactor event

    console.log("got video")
    console.log("data:", data)
    // loadVideo() ...
    const { position } = data
    console.log("position:", position)

    let video
    switch (position) {
      case "next":
          video = await actions.nextVideo(evt)
        break;
      case "prev":
          video = await actions.prevVideo(evt)
        break;
      case "first":
          video = await actions.firstVideo(evt)
        break;
      default:
        throw new Error("position not recognized - valid options: first, next, prev")
    }

    // const { id, name, nickname, avatar, covers, videoUrl, webVideoUrl, playCount, shareCount
    // } = video

    const { resource, query, idxCurrent } = getState()
    const videoData = {
      video: video,
      state: { resource, query, idxCurrent },
    }
    evt.sender.send('load-video-reply', videoData)
  })
}

// API

// ttCall - tiktokCall
const ttCall = async ({ resource, query, ttOptions }) => {
  switch (resource) {
    // "restify" internal js API (use plural resource names)
    case "users":
      const username = query
      return await tt.user(username, ttOptions)
      break;
    case "hashtags":
      const hashtag = query
      return await tt.hashtag(hashtag, ttOptions)
      break;
    case "trending":
      const trend = null
      return await tt.trending(trend, ttOptions)
      break;
    default:
      throw new Error("ttCall error - resource not processable - not in: users, hashtags ")
  }
}

// load video

const loadVideo = async ({ resource, query, idx }) => {
  console.log("loadVideo()")
  console.log(`resource: ${resource}`)
  console.log(`query: ${query}`)
  console.log(`idx: ${idx}`)

  const ttOptionsSession = { number: idx+1 }
  const ttOptions = mergeObjects(ttOptionsDefault, ttOptionsSession)

  const result = await ttCall({ resource, query, ttOptions })
  const { collector } = result

  // TODO: refactor / fix
  // const ttParse({ result }) => { // ... }
  const users = collector
  console.log("users:", users)
  const user = users[idx]

  const { id, name, nickname, avatar, covers, videoUrl, webVideoUrl, playCount, shareCount, commentCount } = user
  // authorMeta
  //   nickName
  //   avatar

  const { default: defaultCover } = covers
  console.log(`'load-video-reply' evt ready`)
  console.log(`video id: ${id}`)
  console.log(`nickname: ${nickname}`)
  console.log(`webVideoUrl: ${videoUrl}`)
  // console.log(user.id)

  return {
    id, name, nickname, avatar,
    covers, videoUrl, webVideoUrl, playCount, shareCount
  }
}

// main

const main = () => {
  bindEventsIPC()
}

// electron window management

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    // 720*1280 - 80%
    width: 576,
    height: 1024,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('index.html')

  if (CONF.devToolsOpen) mainWindow.webContents.openDevTools()

  main()
}

app.whenReady().then(() => {
  createWindow()

  // macos fix
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
