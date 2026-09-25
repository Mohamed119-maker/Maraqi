import { NavItem } from "./nav-item";

export interface NavGroup {
     label: string;
    action?: boolean;
    items: NavItem[];
}
