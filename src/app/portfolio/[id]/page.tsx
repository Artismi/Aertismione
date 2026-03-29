import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PORTFOLIO } from '@/config/content'
import { ProjectPage } from './ProjectPage'
import { IllustrationsGallery } from './IllustrationsGallery'

type Props = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return PORTFOLIO.projects.map((p) => ({ id: p.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const project = PORTFOLIO.projects.find((p) => p.id === id)
  if (!project) return {}
  return {
    title: `${project.title} — Artismi`,
    description: project.tagline,
    openGraph: {
      title: project.title,
      description: project.tagline,
      images: project.mainImage ? [project.mainImage] : [],
    },
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  const index = PORTFOLIO.projects.findIndex((p) => p.id === id)
  if (index === -1) notFound()

  const project = PORTFOLIO.projects[index]

  if (id === 'illustrazioni') {
    return <IllustrationsGallery project={project} />
  }

  const prev = index > 0 ? PORTFOLIO.projects[index - 1] : null
  const next = index < PORTFOLIO.projects.length - 1 ? PORTFOLIO.projects[index + 1] : null

  return (
    <ProjectPage
      project={project}
      prev={prev}
      next={next}
      index={index}
      total={PORTFOLIO.projects.length}
    />
  )
}
