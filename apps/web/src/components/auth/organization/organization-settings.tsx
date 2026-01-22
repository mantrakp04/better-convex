import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationListDropdown from "./organization-list-dropdown";
import OrganizationTab from "./organization-tab";
import MembersTab from "./members-tab";
import TeamsTab from "./teams-tab";

export default function OrganizationSettings() {
  return (
    <Tabs defaultValue="organization" className="w-full gap-4">
      <TabsList variant="line" className="w-full justify-between">
        <div className="flex gap-2">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </div>
        <OrganizationListDropdown />
      </TabsList>
      <TabsContent value="organization">
        <OrganizationTab />
      </TabsContent>
      <TabsContent value="members">
        <MembersTab />
      </TabsContent>
      <TabsContent value="teams">
        <TeamsTab />
      </TabsContent>
    </Tabs>
  );
}
