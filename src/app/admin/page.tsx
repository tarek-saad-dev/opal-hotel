import type { Metadata } from "next";
import { AdminCms } from "@/components/AdminCms";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Owner CMS | Opal Legacy",robots:{index:false,follow:false}};
export default function CmsAdminPage(){return <AdminCms/>;}
