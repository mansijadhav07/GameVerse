import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Edit, Trash2, Users, Gamepad2, TrendingUp, Star, 
  DollarSign, Activity, Shield, Settings, Search, Ban, UserPlus,
  Bell, Layout, ChevronDown
} from "lucide-react";
import { useState } from "react";

const EnhancedAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<"dashboard" | "games" | "users" | "transactions" | "logs" | "settings">("dashboard");
  const [showAddForm, setShowAddForm] = useState(false);

  const stats = [
    { icon: Users, label: "Total Users", value: "45,231", change: "+12.5%", color: "text-primary", trend: "up" },
    { icon: Gamepad2, label: "Total Games", value: "128", change: "+5", color: "text-secondary", trend: "up" },
    { icon: TrendingUp, label: "Active Sessions", value: "12,458", change: "+8.3%", color: "text-success", trend: "up" },
    { icon: DollarSign, label: "Revenue (24h)", value: "$45,892", change: "+15.2%", color: "text-accent", trend: "up" },
  ];

  const games = [
    { id: 1, title: "Cyber Warfare", genre: "FPS", players: "150K+", revenue: "$12,450", status: "Active" },
    { id: 2, title: "Mystic Realms", genre: "RPG", players: "200K+", revenue: "$18,920", status: "Active" },
    { id: 3, title: "Neon Rush", genre: "Racing", players: "120K+", revenue: "$9,340", status: "Active" },
    { id: 4, title: "Strategy Command", genre: "Strategy", players: "80K+", revenue: "$6,780", status: "Maintenance" },
  ];

  const users = [
    { id: 1, username: "ProGamer123", email: "gamer@email.com", joinDate: "2024-12-15", status: "Active", spent: "$245.50" },
    { id: 2, username: "NinjaPlayer", email: "ninja@email.com", joinDate: "2024-12-20", status: "Active", spent: "$189.99" },
    { id: 3, username: "GameMaster", email: "master@email.com", joinDate: "2025-01-05", status: "Blocked", spent: "$567.80" },
    { id: 4, username: "SpeedRunner", email: "speed@email.com", joinDate: "2025-01-08", status: "Active", spent: "$123.45" },
  ];

  const transactions = [
    { id: 1, user: "ProGamer123", game: "Cyber Warfare", amount: "$15.99", date: "2025-01-15 14:23", status: "Completed" },
    { id: 2, user: "NinjaPlayer", game: "Mystic Realms", amount: "$24.99", date: "2025-01-15 13:45", status: "Completed" },
    { id: 3, user: "GameMaster", game: "Neon Rush", amount: "$19.99", date: "2025-01-15 12:10", status: "Pending" },
    { id: 4, user: "SpeedRunner", game: "Strategy Command", amount: "$29.99", date: "2025-01-15 11:30", status: "Failed" },
  ];

  const activityLogs = [
    { id: 1, action: "User Registration", user: "SpeedRunner", time: "5 mins ago", type: "user" },
    { id: 2, action: "Game Updated", details: "Cyber Warfare v1.5", time: "15 mins ago", type: "game" },
    { id: 3, action: "Transaction Completed", user: "ProGamer123", time: "25 mins ago", type: "transaction" },
    { id: 4, action: "User Blocked", user: "GameMaster", time: "1 hour ago", type: "admin" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-card/10 to-background">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 flex items-center gap-3">
              <Shield className="h-10 w-10 text-primary" />
              Admin <span className="text-primary">Control Panel</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your gaming platform with powerful admin tools
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8 flex flex-wrap gap-2">
            {[
              { key: "dashboard", label: "Dashboard", icon: Layout },
              { key: "games", label: "Games", icon: Gamepad2 },
              { key: "users", label: "Users", icon: Users },
              { key: "transactions", label: "Transactions", icon: DollarSign },
              { key: "logs", label: "Activity Logs", icon: Activity },
              { key: "settings", label: "Settings", icon: Settings },
            ].map((section) => (
              <Button
                key={section.key}
                variant={activeSection === section.key ? "hero" : "outline"}
                onClick={() => setActiveSection(section.key as any)}
                className={`gap-2 transition-all duration-500 ${
                  activeSection === section.key ? "shadow-hover" : ""
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </Button>
            ))}
          </div>

          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-scale-in">
                {stats.map((stat, index) => (
                  <Card 
                    key={index} 
                    className="p-6 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-hover hover:scale-105 hover:-translate-y-2 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-gradient-accent rounded-lg group-hover:shadow-hover-accent transition-all duration-500">
                        <stat.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <span className={`text-sm font-semibold ${stat.trend === "up" ? "text-success" : "text-destructive"}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </Card>
                ))}
              </div>

              {/* Charts & Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border-border hover:border-secondary/50 transition-all duration-500 hover:shadow-hover-secondary">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    Revenue Overview (Last 7 Days)
                  </h3>
                  <div className="space-y-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{day}</span>
                          <span className="font-semibold">${((i + 1) * 5234).toLocaleString()}</span>
                        </div>
                        <Progress value={(i + 1) * 14} className="h-2" />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 border-border hover:border-accent/50 transition-all duration-500 hover:shadow-hover-accent">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-accent" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {activityLogs.slice(0, 6).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-muted/30 rounded-lg border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-glow-accent group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-accent rounded-full group-hover:shadow-glow-accent"></div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{log.action}</p>
                            <p className="text-xs text-muted-foreground">{log.user || log.details}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{log.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Games Management Section */}
          {activeSection === "games" && (
            <Card className="p-6 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-hover animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Game Management</h2>
                <Button
                  variant="hero"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="gap-2 shadow-hover"
                >
                  <Plus className="h-4 w-4" />
                  Add New Game
                </Button>
              </div>

              {showAddForm && (
                <Card className="p-6 mb-6 bg-muted/30 border-border animate-scale-in">
                  <h3 className="text-lg font-semibold mb-4">Add New Game</h3>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="game-title">Game Title</Label>
                      <Input id="game-title" placeholder="Enter game title" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="game-genre">Genre</Label>
                      <Input id="game-genre" placeholder="e.g., FPS, RPG" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="game-description">Description</Label>
                      <Input id="game-description" placeholder="Brief description" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="game-price">Price ($)</Label>
                      <Input id="game-price" type="number" placeholder="19.99" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="game-image">Image URL</Label>
                      <Input id="game-image" placeholder="Image URL" className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="game-status">Status</Label>
                      <Input id="game-status" placeholder="Active/Maintenance" className="bg-background" />
                    </div>
                    <div className="md:col-span-2 flex gap-3">
                      <Button type="submit" variant="hero" className="flex-1 shadow-hover">
                        Save Game
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Game Title</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Genre</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Players</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Revenue</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {games.map((game) => (
                      <tr key={game.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 text-sm">{game.id}</td>
                        <td className="px-4 py-4 font-medium">{game.title}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{game.genre}</td>
                        <td className="px-4 py-4 text-sm">{game.players}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-success">{game.revenue}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              game.status === "Active"
                                ? "bg-success/20 text-success"
                                : "bg-amber-500/20 text-amber-500"
                            }`}
                          >
                            {game.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:shadow-glow-primary">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:shadow-glow-accent">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Users Management Section */}
          {activeSection === "users" && (
            <Card className="p-6 border-border hover:border-secondary/50 transition-all duration-500 hover:shadow-hover-secondary animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">User Management</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-10 w-64" />
                  </div>
                  <Button variant="outline">
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Username</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Join Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Total Spent</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 text-sm">{user.id}</td>
                        <td className="px-4 py-4 font-medium">{user.username}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-4 text-sm">{user.joinDate}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-success">{user.spent}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.status === "Active"
                                ? "bg-success/20 text-success"
                                : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 px-3 hover:shadow-glow-secondary">
                              <UserPlus className="h-4 w-4 mr-1" />
                              Promote
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:shadow-glow-accent">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Transactions Section */}
          {activeSection === "transactions" && (
            <Card className="p-6 border-border hover:border-accent/50 transition-all duration-500 hover:shadow-hover-accent animate-fade-in">
              <h2 className="text-2xl font-bold mb-6">Transaction Monitoring</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Game</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Date & Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 text-sm">{transaction.id}</td>
                        <td className="px-4 py-4 font-medium">{transaction.user}</td>
                        <td className="px-4 py-4 text-sm">{transaction.game}</td>
                        <td className="px-4 py-4 font-semibold text-success">{transaction.amount}</td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{transaction.date}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              transaction.status === "Completed"
                                ? "bg-success/20 text-success"
                                : transaction.status === "Pending"
                                ? "bg-amber-500/20 text-amber-500"
                                : "bg-destructive/20 text-destructive"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Activity Logs Section */}
          {activeSection === "logs" && (
            <Card className="p-6 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-hover animate-fade-in">
              <h2 className="text-2xl font-bold mb-6">Activity Logs</h2>
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary group cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-gradient-accent rounded-lg group-hover:shadow-hover-accent transition-all duration-300">
                        <Activity className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{log.action}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              log.type === "user" ? "bg-primary/20 text-primary" :
                              log.type === "game" ? "bg-secondary/20 text-secondary" :
                              log.type === "transaction" ? "bg-success/20 text-success" :
                              "bg-accent/20 text-accent"
                            }`}
                          >
                            {log.type}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.user || log.details}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <Card className="p-6 border-border hover:border-primary/50 transition-all duration-500 hover:shadow-hover">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Admin Roles
                </h3>
                <div className="space-y-3">
                  {["Super Admin", "Game Manager", "User Manager", "Content Moderator"].map((role, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="font-medium">{role}</span>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 border-border hover:border-secondary/50 transition-all duration-500 hover:shadow-hover-secondary">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-secondary" />
                  Announcements
                </h3>
                <div className="space-y-3">
                  <Input placeholder="Announcement title" className="bg-background" />
                  <Input placeholder="Announcement message" className="bg-background" />
                  <Button variant="hero" className="w-full shadow-hover">
                    <Bell className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                </div>
              </Card>

              <Card className="p-6 border-border hover:border-accent/50 transition-all duration-500 hover:shadow-hover-accent lg:col-span-2">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-accent" />
                  Platform Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Maintenance Mode</Label>
                    <Button variant="outline" className="w-full justify-between">
                      Disabled
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Registration</Label>
                    <Button variant="outline" className="w-full justify-between">
                      Enabled
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Theme Preference</Label>
                    <Button variant="outline" className="w-full justify-between">
                      Dark Mode
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Language</Label>
                    <Button variant="outline" className="w-full justify-between">
                      English
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EnhancedAdminDashboard;
