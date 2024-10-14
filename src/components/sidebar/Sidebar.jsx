import { SidePanel } from '@/components/common'

import { Header } from './header'
import { ToolBar } from './toolBar'
import { Shapes } from './shapes'

const Sidebar = () => {
  return (
    <SidePanel>
      <Header />
      <ToolBar />
      <Shapes />
    </SidePanel>
  )
}

export default Sidebar
