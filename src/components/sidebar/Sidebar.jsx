import { SidePanel } from '@/components/common'

import { Header } from './header'
import { ToolBar } from './toolBar'

const Sidebar = () => {
  return (
    <SidePanel>
      <Header />
      <ToolBar />
    </SidePanel>
  )
}

export default Sidebar
