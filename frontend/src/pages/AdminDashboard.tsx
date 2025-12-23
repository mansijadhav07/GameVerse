import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Users, Gamepad2, TrendingUp, Star } from "lucide-react";
import { useState } from "react";

const AdminDashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);

  const stats = [
    { icon: Users, label: "Total Users", value: "45,231", color: "text-primary" },
    { icon: Gamepad2, label: "Total Games", value: "128", color: "text-secondary" },
    { icon: TrendingUp, label: "Active Sessions", value: "12,458", color: "text-success" },
    { icon: Star, label: "Avg Rating", value: "4.7", color: "text-amber-400" },
  ];

  const games = [
    { id: 1, title: "Cyber Warfare", genre: "FPS", players: "150K+", status: "Active" },
    { id: 2, title: "Mystic Realms", genre: "RPG", players: "200K+", status: "Active" },
    { id: 3, title: "Neon Rush", genre: "Racing", players: "120K+", status: "Active" },
    { id: 4, title: "Strategy Command", genre: "Strategy", players: "80K+", status: "Maintenance" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Admin <span className="text-primary">Dashboard</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your gaming platform
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-scale-in">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 border-border hover:border-primary/50 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-accent rounded-lg">
                    <stat.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Game Management */}
          <Card className="p-6 border-border animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Game Management</h2>
              <Button
                variant="hero"
                onClick={() => setShowAddForm(!showAddForm)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Game
              </Button>
            </div>

            {/* Add Game Form */}
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
                    <Label htmlFor="game-image">Image URL</Label>
                    <Input id="game-image" placeholder="Image URL" className="bg-background" />
                  </div>
                  <div className="md:col-span-2 flex gap-3">
                    <Button type="submit" variant="hero" className="flex-1">
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

            {/* Games Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Game Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Genre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Players</th>
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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
