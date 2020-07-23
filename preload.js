console.log("preload")

const ipc = require('electron').ipcRenderer

const loadVideo = ({ position }) => {
  console.log("loading video ")
  ipc.send('load-video', { position })
}

const submitSearch = ({ query }) => {
  console.log("submitting search", query)
  ipc.send('search', { query })
}

const transition = ({ direction }) => {
  console.log("starting css animation - direction: ", direction)
  // send event
}

// actions trigger an ipc call to the backend
const actions = {
  nextVideo: () => {
    loadVideo({ position: "next" })
    transition({ direction: "next" })
  },
  prevVideo: () => {
    loadVideo({ position: "prev" })
    transition({ direction: "prev" })
  },
  search: ({ query }) => {
    submitSearch({ query })
  }
}

// renderers get data from ipc events data and update the UI
const renderers = {
  loadVideo: ({ video, videoElems }) => {
    console.log("render next/prev video")

    const { vidMain } = videoElems
    // const { vidMain, vidPrev, vidNext } = videoElems // TODO: set prev/next videos as well to enable fast switch
    vidMain.src = video.videoUrl
  },
  // loadVideo: (data) => {
  //   ...
  // },
}

const hideLoadingMsg = () => {
  const loadingElem = document.querySelector(".loading")
  loadingElem.style.display = "none"
}

const bindEvents = ({ videoElems }) => {
  ipc.on('load-video-reply', (event, data) => {
    const { video, state } = data
    console.log("video: ", video)
    console.log("state: ", state)
    renderers.loadVideo({ video, videoElems })
    hideLoadingMsg()
  })

  // ipc.once...
}

const bindMainButtons = ({ buttons }) => {
  const { prevButton, nextButton } = buttons
  prevButton.addEventListener("click", actions.prevVideo)
  nextButton.addEventListener("click", actions.nextVideo)
}

const bindVideoTags = ({ videoElems }) => {
  const { vidMain, vidPrev, vidNext } = videoElems
  vidMain.volume = 0 // muted
  vidMain.volume = 0.25 // low
  // vidMain.volume = 1 // 100%
  vidMain // ... TODO implement
}

const bindHotkeys = () => {
  window.addEventListener("keydown", event => {
    if (event.keyCode === 37) { // left
       actions.prevVideo()
    }
    if (event.keyCode === 39) { // right
      actions.nextVideo()
    }
  })
}

const bindSearchForm = ({ searchForm, searchQueryElem }) => {
  const search = (evt) => {
    evt.preventDefault()
    const query = searchQueryElem.value
    actions.search({ query })
  }
  searchForm.addEventListener("submit", search)
}

const uiMain = () => {
  const buttons = {
    prevButton: document.querySelector(".arrow.arrow-left"),
    nextButton: document.querySelector(".arrow.arrow-right"),
  }
  const videoElems = {
    vidMain: document.querySelector("video.video-main"),
    vidPrev: document.querySelector("video.video-prev"),
    vidNext: document.querySelector("video.video-next"),
  }
  const searchForm = document.querySelector("form.search-form")
  const searchQueryElem = document.querySelector("form.search-form > .field > .control > input")
  bindMainButtons({ buttons })
  bindVideoTags({ videoElems })
  bindSearchForm({ searchForm, searchQueryElem })
  bindEvents({ videoElems })
  bindHotkeys()
}

const sampleCode = () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
}

const tmpTestCode = () => {
  setTimeout(() => {
    console.log("simulating click next")
    const elem = document.querySelector("a.arrow.arrow-right")
    elem.click()
  }, 4000)
}

// const tmpTestCode2 = () => {
//   setInterval(() => {
//     console.log("simulating click next")
//     const elem = document.querySelector("a.arrow.arrow-right")
//     elem.click()
//   }, 7000)
// }

window.addEventListener('DOMContentLoaded', () => {
  uiMain()

  loadVideo({ position: "first" })

  sampleCode()
  // tmpTestCode()
  // tmpTestCode2()
})
