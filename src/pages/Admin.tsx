import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3, Users, MessageSquare, Settings, LogOut, ArrowLeft,
  Trash2, Shield, RefreshCw, Search, Ban, FileText, Megaphone,
  Save, CheckCircle, XCircle
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
  is_blocked: boolean;
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

  // Ad control state
  const [headerAd, setHeaderAd] = useState("");
  const [sidebarAd, setSidebarAd] = useState("");
  const [footerAd, setFooterAd] = useState("");
  const [adSaving, setAdSaving] = useState(false);

  // Content manager state
  const [latestNews, setLatestNews] = useState("");
  const [appFeatures, setAppFeatures] = useState("");
  const [contentSaving, setContentSaving] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    checkAdminAndLoad();
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

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
    const [questionsRes, profilesRes, rolesRes, settingsRes] = await Promise.all([
      supabase.from("questions_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("app_settings").select("*"),
    ]);

    const q = (questionsRes.data || []) as QuestionLog[];
    setQuestions(q);
    setProfiles((profilesRes.data || []) as Profile[]);
    setUserRoles((rolesRes.data || []) as UserRole[]);

    // Load settings
    const settings = settingsRes.data || [];
    settings.forEach((s: any) => {
      const val = typeof s.value === "string" ? s.value : (s.value as any)?.text || "";
      switch (s.key) {
        case "ad_header": setHeaderAd(val); break;
        case "ad_sidebar": setSidebarAd(val); break;
        case "ad_footer": setFooterAd(val); break;
        case "content_news": setLatestNews(val); break;
        case "content_features": setAppFeatures(val); break;
      }
    });

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

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    await supabase.from("profiles").update({ is_blocked: !currentlyBlocked }).eq("id", userId);
    setProfiles((prev) => prev.map((p) => p.id === userId ? { ...p, is_blocked: !currentlyBlocked } : p));
    toast({ title: currentlyBlocked ? "User unblocked" : "User blocked" });
  };

  const handleDeleteUser = async (userId: string) => {
    // Delete roles, then profile
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    setProfiles((prev) => prev.filter((p) => p.id !== userId));
    setUserRoles((prev) => prev.filter((r) => r.user_id !== userId));
    toast({ title: "User deleted" });
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

  const upsertSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase.from("app_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("app_settings").update({ value: JSON.stringify({ text: value }), updated_at: new Date().toISOString() }).eq("key", key);
    } else {
      await supabase.from("app_settings").insert({ key, value: JSON.stringify({ text: value }) });
    }
  };

  const handleSaveAds = async () => {
    setAdSaving(true);
    await Promise.all([
      upsertSetting("ad_header", headerAd),
      upsertSetting("ad_sidebar", sidebarAd),
      upsertSetting("ad_footer", footerAd),
    ]);
    setAdSaving(false);
    toast({ title: "Ad scripts saved!" });
  };

  const handleSaveContent = async () => {
    setContentSaving(true);
    await Promise.all([
      upsertSetting("content_news", latestNews),
      upsertSetting("content_features", appFeatures),
    ]);
    setContentSaving(false);
    toast({ title: "Content saved!" });
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
      <div className="min-h-screen bg-background flex items-center justify-center dark">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 dark">
        <Card className="max-w-sm w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="w-16 h-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground">You don't have admin privileges.</p>
            <div className="flex gap-3 justify-center">
              <Link to="/"><Button variant="outline" size="lg">Go Home</Button></Link>
              <Button variant="ghost" size="lg" onClick={handleLogout}>Sign Out</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-12 w-12">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage your app</p>
          </div>
          <Button variant="outline" size="lg" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full h-auto p-1.5 gap-1">
            <TabsTrigger value="analytics" className="gap-1.5 text-xs py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-1.5 text-xs py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="w-4 h-4" /> <span className="hidden sm:inline">Questions</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4" /> <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="gap-1.5 text-xs py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Megaphone className="w-4 h-4" /> <span className="hidden sm:inline">Ads</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-1.5 text-xs py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-5 text-center">
                  <p className="text-4xl font-bold text-primary">{stats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Questions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5 text-center">
                  <p className="text-4xl font-bold text-primary">{stats.today}</p>
                  <p className="text-sm text-muted-foreground mt-1">Today</p>
                </CardContent>
              </Card>
              <Card className="col-span-2 md:col-span-1">
                <CardContent className="p-5 text-center">
                  <p className="text-4xl font-bold text-primary">{profiles.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Users</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Questions by Subject</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.subjects)
                    .sort(([, a], [, b]) => b - a)
                    .map(([subject, count]) => (
                      <div key={subject} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-28 shrink-0">{subject}</span>
                        <div className="flex-1 bg-secondary rounded-full h-8 overflow-hidden">
                          <div
                            className="h-full rounded-full flex items-center pl-3 text-xs text-primary-foreground font-medium"
                            style={{
                              width: `${Math.max((count / stats.total) * 100, 10)}%`,
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
                  <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Card>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">Question</TableHead>
                      <TableHead className="text-sm">Subject</TableHead>
                      <TableHead className="text-sm">Level</TableHead>
                      <TableHead className="text-sm">Date</TableHead>
                      <TableHead className="w-14"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No questions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuestions.map((q) => (
                        <TableRow key={q.id}>
                          <TableCell className="max-w-[200px] truncate text-sm">
                            {q.question || (q.has_image ? "📷 Image question" : "—")}
                          </TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{q.subject}</Badge></TableCell>
                          <TableCell className="text-sm">{q.level}</TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(q.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => handleDeleteQuestion(q.id)}>
                              <Trash2 className="w-5 h-5 text-destructive" />
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
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm">User</TableHead>
                      <TableHead className="text-sm">Joined</TableHead>
                      <TableHead className="text-sm">Status</TableHead>
                      <TableHead className="text-sm text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No users yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      profiles.map((p) => {
                        const isUserAdmin = userRoles.some((r) => r.user_id === p.id && r.role === "admin");
                        return (
                          <TableRow key={p.id} className={p.is_blocked ? "opacity-60" : ""}>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{p.full_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{p.email || "—"}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(p.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant={isUserAdmin ? "default" : "secondary"} className="text-xs">
                                  {isUserAdmin ? "Admin" : "User"}
                                </Badge>
                                {p.is_blocked && (
                                  <Badge variant="destructive" className="text-xs">Blocked</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 justify-end flex-wrap">
                                <Button
                                  variant={p.is_blocked ? "outline" : "destructive"}
                                  size="sm"
                                  className="h-9 text-xs gap-1"
                                  onClick={() => handleBlockUser(p.id, p.is_blocked)}
                                >
                                  {p.is_blocked ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                  {p.is_blocked ? "Unblock" : "Block"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 text-xs gap-1"
                                  onClick={() => handleToggleAdmin(p.id, isUserAdmin)}
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                  {isUserAdmin ? "Revoke" : "Admin"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 text-xs text-destructive gap-1"
                                  onClick={() => handleDeleteUser(p.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  Ad Script Manager
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Paste your Adsterra or Google Ads scripts below. They'll appear on the main site automatically.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Header Ad (top of page)</label>
                  <Textarea
                    placeholder="Paste header ad script here..."
                    value={headerAd}
                    onChange={(e) => setHeaderAd(e.target.value)}
                    className="min-h-[100px] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sidebar / In-Content Ad</label>
                  <Textarea
                    placeholder="Paste sidebar ad script here..."
                    value={sidebarAd}
                    onChange={(e) => setSidebarAd(e.target.value)}
                    className="min-h-[100px] font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Footer Ad (bottom of page)</label>
                  <Textarea
                    placeholder="Paste footer ad script here..."
                    value={footerAd}
                    onChange={(e) => setFooterAd(e.target.value)}
                    className="min-h-[100px] font-mono text-xs"
                  />
                </div>
                <Button onClick={handleSaveAds} disabled={adSaving} size="lg" className="w-full gap-2 h-12">
                  <Save className="w-5 h-5" />
                  {adSaving ? "Saving..." : "Save Ad Scripts"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Content Manager
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update site content directly — no GitHub needed.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Latest News / Announcement</label>
                  <Textarea
                    placeholder="e.g. 🎉 New feature: Image-based questions now supported!"
                    value={latestNews}
                    onChange={(e) => setLatestNews(e.target.value)}
                    className="min-h-[120px] text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">App Features Description</label>
                  <Textarea
                    placeholder="Describe the app features shown to users..."
                    value={appFeatures}
                    onChange={(e) => setAppFeatures(e.target.value)}
                    className="min-h-[120px] text-sm"
                  />
                </div>
                <Button onClick={handleSaveContent} disabled={contentSaving} size="lg" className="w-full gap-2 h-12">
                  <Save className="w-5 h-5" />
                  {contentSaving ? "Saving..." : "Save Content"}
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
