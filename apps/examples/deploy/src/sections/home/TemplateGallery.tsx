'use client'
import { useSignals } from '@cascivo/core'
import { t } from '@cascivo/i18n'
import { Button, Link } from '@cascivo/react'
import { PROJECT_TEMPLATES } from '../../data/edge'
import { deployMsg } from '../../i18n'
import styles from './TemplateGallery.module.css'

export function TemplateGallery() {
  useSignals()

  return (
    <div className={styles['root']}>
      <div className={styles['header']}>
        <h2 className={styles['heading']}>{t(deployMsg.galleryHeading)}</h2>
        <p className={styles['sub']}>{t(deployMsg.gallerySub)}</p>
      </div>

      <div className={styles['list']}>
        {PROJECT_TEMPLATES.map((tpl) => (
          <div key={tpl.id} className={styles['row']}>
            <div className={styles['rowInfo']}>
              <span className={styles['rowName']}>{tpl.name}</span>
              <span className={styles['rowDesc']}>{tpl.description}</span>
            </div>
            <Button variant={tpl.action === 'Import' ? 'secondary' : 'primary'} size="sm">
              {tpl.action === 'Import'
                ? t(deployMsg.galleryImportBtn)
                : t(deployMsg.galleryDeployBtn)}
            </Button>
          </div>
        ))}
      </div>

      <p className={styles['browse']}>
        <Link href="#">{t(deployMsg.galleryBrowseLink)}</Link>
      </p>
    </div>
  )
}
