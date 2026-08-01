import { lazy, StrictMode, Suspense } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { App } from './App'
import './styles.css'

const MotionLab = lazy(() =>
  import('./motion-lab/MotionLab').then((module) => ({
    default: module.MotionLab,
  })),
)

function isMotionLabPath(): boolean {
  return window.location.pathname.replace(/\/+$/, '').endsWith('/motion-lab')
}

const motionLabPath = isMotionLabPath()
if (!motionLabPath) document.documentElement.dataset.page = 'home'

declare global {
  var __foundInTranslationReactRoot: Root | undefined
}

const reactRoot =
  globalThis.__foundInTranslationReactRoot ??
  createRoot(document.getElementById('root')!)
globalThis.__foundInTranslationReactRoot = reactRoot

reactRoot.render(
  <StrictMode>
    {motionLabPath ? (
      <Suspense
        fallback={
          <main className="motion-lab-boot" aria-live="polite">
            Preparing the motion lab…
          </main>
        }
      >
        <MotionLab />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
