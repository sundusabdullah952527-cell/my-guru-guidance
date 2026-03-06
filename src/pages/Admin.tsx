import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, Users, MessageSquare, Settings, LogOut, ArrowLeft,
  Trash2, Shield, RefreshCw, Search
} from "lucide-react";
import { Link } from "react-router-dom";

interface QuestionLog {
  id: string;
  question: string | null;
  subject: string;
  level: string;
  has_image: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [questions, setQuestions] = useState<QuestionLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, today: 0, subjects: {} as Record<string, number> });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin");

    if (!roleData || roleData.length === 0) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const [questionsRes, profilesRes, rolesRes] = await Promise.all([
      supabase.from("questions_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);

    const q = (questionsRes.data || []) as QuestionLog[];
    setQuestions(q);
    setProfiles((profilesRes.data || []) as Profile[]);
    setUserRoles((rolesRes.data || []) as UserRole[]);

    // Calculate stats
    const today = new Date().toISOString().split("T")[0];
    const subjects: Record<string, number> = {};
    let todayCount = 0;
    q.forEach((item) => {
      subjects[item.subject] = (subjects[item.subject] || 0) + 1;
      if (item.created_at.startsWith(today)) todayCount++;
    });
    setStats({ total: q.length, today: todayCount, subjects });
  };

  const handleDeleteQuestion = async (id: string) => {
    await supabase.from("questions_log").delete().eq("id", id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast({ title: "Question deleted" });
  };

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      setUserRoles((prev) => prev.filter((r) => !(r.user_id === userId && r.role === "admin")));
    } else {
      const { data } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" }).select();
      if (data) setUserRoles((prev) => [...prev, ...(data as UserRole[])]);
    }
    toast({ title: currentlyAdmin ? "Admin removed" : "Admin granted" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredQuestions = questions.filter(
    (q) =>
      (q.question || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="p-6 text-center space-y-4">
            <Shield className="w-12 h-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground text-sm">You don't have admin privileges.</p>
            <div className="flex gap-2 justify-center">
              <Link to="/"><Button variant="outline">Go Home</Button></Link>
              <Button variant="ghost" onClick={handleLogout}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="text-lg font-bold flex-1">Admin Panel</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="analytics" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" /> Questions
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs">
              <Users className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-xs">
              <Settings className="w-3.5 h-3.5" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{stats.today}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{profiles.length}</p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Questions by Subject</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.subjects)
                    .sort(([, a], [, b]) => b - a)
                    .map(([subject, count]) => (
                      <div key={subject} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-24">{subject}</span>
                        <div className="flex-1 bg-secondary rounded-full h-6 overflow-hidden">
                          <div
                            className="h-full rounded-full flex items-center pl-2 text-xs text-primary-foreground font-medium"
                            style={{
                              width: `${Math.max((count / stats.total) * 100, 8)}%`,
                              background: "var(--solve-gradient)",
                            }}
                          >
                            {count}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {Object.keys(stats.subjects).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Card>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No questions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuestions.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="max-w-xs truncate">
                            {q.question || (q.has_image ? "📷 Image question" : "—")}
                          </TableCell>
                          <TableCell><Badge variant="secondary">{q.subject}</Badge></TableCell>
                          <TableCell className="text-sm">{q.level}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(q.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No users yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((p) => {
                      const isUserAdmin = userRoles.some((r) => r.user_id === p.id && r.role === "admin");
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm">{p.email || "—"}</TableCell>
                          <TableCell className="text-sm">{p.full_name || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isUserAdmin ? "default" : "secondary"}>
                              {isUserAdmin ? "Admin" : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAdmin(p.id, isUserAdmin)}
                              className="text-xs"
                            >
                              {isUserAdmin ? "Remove Admin" : "Make Admin"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">App Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm font-medium">Available Subjects</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Math, Science, English, History, Computer Science, Economics
                  </p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm font-medium">Available Levels</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Class 8–12, Undergraduate
                  </p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm font-medium">AI Model</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Powered by Lovable AI (Gemini 2.5 Flash)
                  </p>
                </div>
                <Button variant="outline" onClick={loadData} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Refresh Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
