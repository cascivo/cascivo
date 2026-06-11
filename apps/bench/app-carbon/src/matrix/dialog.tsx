import { Modal } from '@carbon/react'
import { createRoot } from 'react-dom/client'
import '../index.scss'
createRoot(document.getElementById('root')!).render(
  <Modal
    open={true}
    modalHeading="Test"
    primaryButtonText="OK"
    onRequestClose={() => {}}
    onRequestSubmit={() => {}}
  />,
)
