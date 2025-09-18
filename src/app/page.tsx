import { FamilyTreeView } from '@/components/family-tree-view'
import { Header } from '@/components/header'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <div className="w-full">
        <FamilyTreeView />
      </div>
    </main>
  )
}