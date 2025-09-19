import { FamilyTreeView } from '@/components/family-tree-view'
import { Header } from '@/components/header'

export default function Home() {
  return (
    <main className="h-screen w-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      <Header />
      <div className="flex-1 w-full overflow-hidden">
        <FamilyTreeView />
      </div>
    </main>
  )
}