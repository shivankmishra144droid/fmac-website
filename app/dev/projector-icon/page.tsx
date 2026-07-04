import { ProjectorIcon } from "@/components/ProjectorIcon";

export default function ProjectorIconPreviewPage() {
  return (
    <main className="min-h-screen bg-ink px-8 py-16">
      <h1 className="type-label mb-10 tracking-label text-parchment/50">
        ProjectorIcon size check
      </h1>
      <div className="flex flex-wrap items-end gap-16">
        <div className="text-center">
          <p className="type-label mb-3 text-parchment/40">Nav — 24px</p>
          <ProjectorIcon size={24} animate={false} />
        </div>
        <div className="text-center">
          <p className="type-label mb-3 text-parchment/40">Mobile — 52px</p>
          <ProjectorIcon size={52} animate={false} />
        </div>
        <div className="text-center">
          <p className="type-label mb-3 text-parchment/40">Slider — 148px</p>
          <ProjectorIcon size={148} animate={false} />
        </div>
        <div className="text-center">
          <p className="type-label mb-3 text-parchment/40">Hero — 220px</p>
          <ProjectorIcon size={220} animate={false} />
        </div>
      </div>
    </main>
  );
}
