/**
 * La pagina di un lavoro aperta dalla home: la stessa di /portfolio/[id], ma la home
 * resta montata sotto (nascosta, vedi HomeShell), cosi' tornando il 3D e' gia' pronto.
 */
import { notFound } from 'next/navigation'
import { PORTFOLIO } from '@/config/content'
import { ProjectPage } from '../../../portfolio/[id]/ProjectPage'

type Props = { params: Promise<{ id: string }> }

export default async function Page({ params }: Props) {
  const { id } = await params
  const index = PORTFOLIO.projects.findIndex((p) => p.id === id)
  if (index === -1) notFound()
  const project = PORTFOLIO.projects[index]
  return (
    <ProjectPage
      project={project}
      prev={index > 0 ? PORTFOLIO.projects[index - 1] : null}
      next={index < PORTFOLIO.projects.length - 1 ? PORTFOLIO.projects[index + 1] : null}
      index={index}
      total={PORTFOLIO.projects.length}
    />
  )
}
