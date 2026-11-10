import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Myco — Infrastructure for software quality',description:'Myco connects intent, code and evidence across the software lifecycle.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
