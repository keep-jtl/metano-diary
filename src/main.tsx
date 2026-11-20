import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles-fonts.css'
import './styles.css'
import './styles-cover.css'
import './styles-plan.css'
import './styles-mood.css'
import './styles-daily.css'
import './styles-report.css'
import './styles-prefs.css'
import { applyPreferencesToDocument } from './lib/prefs'
import { App } from './App'

applyPreferencesToDocument()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
