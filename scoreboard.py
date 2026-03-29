import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import requests
import csv
from datetime import datetime

class ToolTip:
    def __init__(self, widget, text):
        self.widget = widget
        self.text = text
        self.tip_window = None
        widget.bind("<Enter>", self.show_tip)
        widget.bind("<Leave>", self.hide_tip)

    def show_tip(self, event=None):
        if self.tip_window or not self.text: return
        x = self.widget.winfo_rootx() + 20
        y = self.widget.winfo_rooty() + self.widget.winfo_height() + 5
        self.tip_window = tw = tk.Toplevel(self.widget)
        tw.wm_overrdr(True)
        tw.wm_geometry(f"+{x}+{y}")
        tk.Label(tw, text=self.text, justify='left', background="#ffffe0", 
                 relief='solid', borderwidth=1, font=("tahoma", "9", "normal"),
                 wraplength=450).pack(ipadx=8, ipady=8)

    def hide_tip(self, event=None):
        tw = self.tip_window
        if tw: tw.destroy()
        self.tip_window = None

class CompetitionScoreboard:
    def __init__(self, root):
        self.root = root
        self.root.title("CIHSCDC Competition Manager")
        self.root.geometry("1650x900")

        self.webhooks = {}  
        self.broadcast_times = {} 
        self.teams = {}
        self.inject_data = {}

        self.init_defaults()

        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill='both', expand=True)

        self.score_tab, self.entry_tab, self.scores_tab, self.manage_tab = ttk.Frame(self.notebook), ttk.Frame(self.notebook), ttk.Frame(self.notebook), ttk.Frame(self.notebook)
        self.notebook.add(self.score_tab, text="🏆 Leaderboard")
        self.notebook.add(self.entry_tab, text="📝 Data Entry")
        self.notebook.add(self.scores_tab, text="📊 Scores")
        self.notebook.add(self.manage_tab, text="⚙️ Management")

        self.setup_leaderboard()
        self.setup_entry_form()
        self.setup_scores_tab()
        self.setup_management_tab()
        self.update_leaderboard()
        self.auto_save_loop()

    def init_defaults(self):
        t_list = [("VADER", "Wheaton Warrenville South HS"), ("Free RAM.gov", "Wheaton Warrenville South HS"),
                  ("Team 404", "Pekin Community HS"), ("Team DHCP", "Pekin Community HS"),
                  ("NCHS Cybersecurity", "Normal Community HS")]
        for n, s in t_list:
            self.teams[n] = {"school": s, "uptime": 0.0, "red_team": 0.0, "defense": 0.0, "injects": {}}

    def _init_team_injects(self, team_name):
        for inject in self.inject_data:
            if inject not in self.teams[team_name]["injects"]:
                self.teams[team_name]["injects"][inject] = {"raw": 10.0, "late": 0, "final": 10.0, "sub_time": ""}

    def setup_entry_form(self):
        for widget in self.entry_tab.winfo_children(): widget.destroy()
        
        top = ttk.Frame(self.entry_tab); top.pack(fill="x", padx=10, pady=5)
        ttk.Label(top, text="Active Discord Channel:", font=("Arial", 10, "bold")).pack(side="left", padx=5)
        self.channel_selector = ttk.Combobox(top, state="readonly", width=25)
        self.channel_selector.pack(side="left", padx=5)
        self.update_channel_dropdown()

        main = ttk.Frame(self.entry_tab); main.pack(fill="both", expand=True)
        left = ttk.Frame(main); left.pack(side="left", fill="y", padx=10, pady=10)
        self.team_listbox = tk.Listbox(left, width=25, font=("Arial", 11), exportselection=False)
        self.team_listbox.pack(fill="both", expand=True)
        self.team_listbox.bind('<<ListboxSelect>>', self.load_team_data)

        right = ttk.LabelFrame(main, text="Team Scoring Grid")
        right.pack(side="right", fill="both", expand=True, padx=10, pady=10)
        
        canvas = tk.Canvas(right); sb = ttk.Scrollbar(right, orient="vertical", command=canvas.yview)
        scroll_frame = ttk.Frame(canvas)
        scroll_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
        canvas.create_window((0, 0), window=scroll_frame, anchor="nw")
        canvas.configure(yscrollcommand=sb.set)
        canvas.pack(side="left", fill="both", expand=True); sb.pack(side="right", fill="y")

        headers = ["Inject Name", "Raw (0-10)", "Sub Time", "Mins Late", "Final Score", "Broadcast"]
        for i, h in enumerate(headers):
            ttk.Label(scroll_frame, text=h, font=("Arial", 9, "bold")).grid(row=0, column=i, padx=5, pady=5)

        self.entry_widgets = {}
        for i, (inj, info) in enumerate(self.inject_data.items(), 1):
            lbl = ttk.Label(scroll_frame, text=inj); lbl.grid(row=i, column=0, sticky="w", padx=10)
            ToolTip(lbl, f"DESC: {info['desc']}\nKEY: {info['sol']}")
            
            p_ent = ttk.Entry(scroll_frame, width=8); p_ent.grid(row=i, column=1)
            s_ent = ttk.Entry(scroll_frame, width=10); s_ent.grid(row=i, column=2)
            l_ent = ttk.Entry(scroll_frame, width=8); l_ent.grid(row=i, column=3)
            f_lbl = tk.Label(scroll_frame, text="0.0", fg="blue", font=("Arial", 10, "bold")); f_lbl.grid(row=i, column=4)
            
            # Key Release and Focus Out bindings for LIVE updates
            s_ent.bind("<KeyRelease>", lambda e, name=inj: self.trigger_live_update(name))
            p_ent.bind("<KeyRelease>", lambda e, name=inj: self.trigger_live_update(name))
            l_ent.bind("<KeyRelease>", lambda e, name=inj: self.trigger_live_update(name))
            
            ttk.Button(scroll_frame, text="Discord", command=lambda n=inj: self.send_to_discord(n)).grid(row=i, column=5, padx=5)
            ts = self.broadcast_times.get(inj, "N/A")
            ttk.Label(scroll_frame, text=f"Start: {ts}", font=("Arial", 7)).grid(row=i, column=6)

            self.entry_widgets[inj] = {"p": p_ent, "s": s_ent, "l": l_ent, "f": f_lbl}

        save_btn_row = len(self.inject_data) + 1
        ttk.Button(scroll_frame, text="SAVE SCORES", command=self.save_team_data).grid(row=save_btn_row, column=0, columnspan=6, pady=20)
        for team in sorted(self.teams.keys()): self.team_listbox.insert(tk.END, team)

    def trigger_live_update(self, inject_name):
        """Calculates final score: Raw score minus minutes late."""
        try:
            raw_val = self.entry_widgets[inject_name]["p"].get().strip()
            sub_time = self.entry_widgets[inject_name]["s"].get().strip()
            start_time_str = self.broadcast_times.get(inject_name)
            duration_mins = self.inject_data[inject_name].get('time', '30')
            
            raw = float(raw_val) if raw_val else 0.0
            
            # 1. Attempt Auto-Calc Lateness if Sub Time is present
            if start_time_str and sub_time and len(sub_time) >= 4:
                now = datetime.now()
                start_dt = datetime.strptime(start_time_str, "%H:%M:%S").replace(year=now.year, month=now.month, day=now.day)
                s_fmt = "%H:%M:%S" if sub_time.count(":") == 2 else "%H:%M"
                sub_dt = datetime.strptime(sub_time, s_fmt).replace(year=now.year, month=now.month, day=now.day)
                
                diff = (sub_dt - start_dt).total_seconds() / 60
                auto_late = max(0, int(diff - float(duration_mins)))
                
                # Update the box only if the user isn't actively typing in it
                if self.root.focus_get() != self.entry_widgets[inject_name]["l"]:
                    self.entry_widgets[inject_name]["l"].delete(0, tk.END)
                    self.entry_widgets[inject_name]["l"].insert(0, str(auto_late))

            # 2. Get Late Mins from the box (allows manual override)
            late_box_val = self.entry_widgets[inject_name]["l"].get().strip()
            late = int(late_box_val) if late_box_val else 0

            # 3. Calculate Final Score: subtract minutes late directly from raw score
            final_score = max(0.0, raw - late)
            
            self.entry_widgets[inject_name]["f"].config(text=f"{final_score:.1f}")
            
        except:
            pass

    def setup_scores_tab(self):
        for widget in self.scores_tab.winfo_children(): widget.destroy()

        top = ttk.Frame(self.scores_tab); top.pack(fill="x", padx=10, pady=5)
        ttk.Button(top, text="Refresh", command=self.update_scores_tab).pack(side="left", padx=5)
        ttk.Label(top, text="Uptime % = Uptime/50 | Injects % = Injects Total/50 | Defense = Red Team/5 | Total = 0.33×each",
                  font=("Arial", 8), foreground="gray").pack(side="left", padx=10)

        cols = ("Team", "School", "Uptime", "Uptime %", "Injects (Total)", "Injects %",
                "Red Team Assessment", "Defense against Red Team", "Total", "Remarks")
        self.scores_tree = ttk.Treeview(self.scores_tab, columns=cols, show="headings")
        widths = [120, 180, 70, 80, 100, 80, 140, 160, 80, 120]
        for col, w in zip(cols, widths):
            self.scores_tree.heading(col, text=col)
            self.scores_tree.column(col, width=w, anchor="center")

        sb_x = ttk.Scrollbar(self.scores_tab, orient="horizontal", command=self.scores_tree.xview)
        sb_y = ttk.Scrollbar(self.scores_tab, orient="vertical", command=self.scores_tree.yview)
        self.scores_tree.configure(xscrollcommand=sb_x.set, yscrollcommand=sb_y.set)
        self.scores_tree.pack(fill="both", expand=True, padx=10, pady=(0, 0))
        sb_x.pack(fill="x", padx=10); sb_y.pack(side="right", fill="y")

        # Input section for Uptime and Red Team scores
        inp = ttk.LabelFrame(self.scores_tab, text="Enter Uptime & Red Team Assessment")
        inp.pack(fill="x", padx=10, pady=5)

        ttk.Label(inp, text="Team:").grid(row=0, column=0, padx=5, pady=4, sticky="e")
        self.scores_team_var = tk.StringVar()
        self.scores_team_cb = ttk.Combobox(inp, textvariable=self.scores_team_var, state="readonly", width=20)
        self.scores_team_cb.grid(row=0, column=1, padx=5, pady=4, sticky="w")

        ttk.Label(inp, text="Uptime (raw):").grid(row=0, column=2, padx=5, sticky="e")
        self.scores_uptime_var = tk.StringVar()
        ttk.Entry(inp, textvariable=self.scores_uptime_var, width=10).grid(row=0, column=3, padx=5)

        ttk.Label(inp, text="Red Team Assessment (raw):").grid(row=0, column=4, padx=5, sticky="e")
        self.scores_red_var = tk.StringVar()
        ttk.Entry(inp, textvariable=self.scores_red_var, width=10).grid(row=0, column=5, padx=5)

        ttk.Label(inp, text="Remarks:").grid(row=0, column=6, padx=5, sticky="e")
        self.scores_remarks_var = tk.StringVar()
        ttk.Entry(inp, textvariable=self.scores_remarks_var, width=20).grid(row=0, column=7, padx=5)

        ttk.Button(inp, text="Save", command=self._save_scores_row).grid(row=0, column=8, padx=10)

        self.scores_team_cb.bind("<<ComboboxSelected>>", self._load_scores_row)
        self._refresh_scores_team_list()
        self.update_scores_tab()

    def _refresh_scores_team_list(self):
        teams = sorted(self.teams.keys())
        self.scores_team_cb['values'] = teams
        if teams: self.scores_team_cb.current(0); self._load_scores_row()

    def _load_scores_row(self, event=None):
        t = self.scores_team_var.get()
        if not t or t not in self.teams: return
        d = self.teams[t]
        self.scores_uptime_var.set(str(d.get("uptime", 0.0)))
        self.scores_red_var.set(str(d.get("red_team", 0.0)))
        self.scores_remarks_var.set(str(d.get("remarks", "")))

    def _save_scores_row(self):
        t = self.scores_team_var.get()
        if not t or t not in self.teams: return
        try:
            self.teams[t]["uptime"] = float(self.scores_uptime_var.get() or 0)
            self.teams[t]["red_team"] = float(self.scores_red_var.get() or 0)
            self.teams[t]["remarks"] = self.scores_remarks_var.get().strip()
            self.update_scores_tab()
            self.update_leaderboard()
        except ValueError:
            messagebox.showerror("Error", "Uptime and Red Team Assessment must be numbers.")

    def update_scores_tab(self):
        if not hasattr(self, 'scores_tree'): return
        for item in self.scores_tree.get_children(): self.scores_tree.delete(item)
        for name, d in sorted(self.teams.items()):
            uptime = d.get("uptime", 0.0)
            red_team = d.get("red_team", 0.0)
            injects_total = sum(i["final"] for i in d["injects"].values())
            uptime_pct = uptime / 50
            injects_pct = injects_total / 50
            defense = red_team / 5
            total = 0.33 * uptime_pct + 0.33 * injects_pct + 0.33 * defense
            remarks = d.get("remarks", "")
            self.scores_tree.insert("", "end", values=(
                name, d.get("school", ""),
                uptime, f"{uptime_pct:.4f}",
                f"{injects_total:.1f}", f"{injects_pct:.4f}",
                red_team, f"{defense:.4f}",
                f"{total:.4f}", remarks
            ))

    def setup_management_tab(self):
        for widget in self.manage_tab.winfo_children(): widget.destroy()
        c = ttk.Frame(self.manage_tab, padding=10); c.pack(fill="both", expand=True)
        
        # Tools Header - RESTORED BUTTONS
        h = ttk.Frame(c); h.pack(fill="x", pady=10)
        ttk.Button(h, text="Import Teams CSV", command=self.import_teams_csv).pack(side="left", padx=2)
        ttk.Button(h, text="Import Injects CSV", command=self.import_injects_csv).pack(side="left", padx=2)
        ttk.Button(h, text="Add Inject Row", command=self.add_inject_row).pack(side="left", padx=2)
        
        ttk.Button(h, text="SAVE GRID CHANGES", command=self.save_all_inject_config).pack(side="right", padx=5)
        ttk.Button(h, text="Export JSON", command=self.export_json).pack(side="right", padx=2)
        ttk.Button(h, text="Import JSON", command=self.import_json).pack(side="right", padx=2)

        # Scrollable Config Grid
        can = tk.Canvas(c); sb = ttk.Scrollbar(c, command=can.yview)
        self.gf = ttk.Frame(can); can.create_window((0,0), window=self.gf, anchor="nw")
        can.configure(yscrollcommand=sb.set); can.pack(side="left", fill="both", expand=True); sb.pack(side="right", fill="y")
        self.gf.bind("<Configure>", lambda e: can.configure(scrollregion=can.bbox("all")))
        
        headers = ["Name", "Description", "Solution", "Duration(m)", "Rel Time", "Due Time", "Action"]
        for j, h in enumerate(headers): ttk.Label(self.gf, text=h, font=("Arial", 9, "bold")).grid(row=0, column=j, padx=5, pady=5)
        
        self.grid_rows = []
        for i, (name, info) in enumerate(self.inject_data.items(), 1):
            self.render_management_row(i, name, info)

    def render_management_row(self, i, name, info):
        n = ttk.Entry(self.gf, width=15); n.grid(row=i, column=0, sticky="n"); n.insert(0, name)
        d = tk.Text(self.gf, width=25, height=4); d.grid(row=i, column=1); d.insert("1.0", info['desc'])
        s = tk.Text(self.gf, width=25, height=4); s.grid(row=i, column=2); s.insert("1.0", info.get('sol', ''))
        t, r, du = ttk.Entry(self.gf, width=8), ttk.Entry(self.gf, width=8), ttk.Entry(self.gf, width=8)
        for idx, (w, val) in enumerate([(t, info['time']), (r, info['release']), (du, info['due'])]): 
            w.grid(row=i, column=idx+3, sticky="n"); w.insert(0, val)
        ttk.Button(self.gf, text="Delete", command=lambda n=name: self.delete_inject(n)).grid(row=i, column=6, sticky="n")
        self.grid_rows.append({'n': n, 'd': d, 's': s, 't': t, 'r': r, 'du': du})

    def save_all_inject_config(self):
        new_data = {}
        for r in self.grid_rows:
            name = r['n'].get().strip()
            if name:
                new_data[name] = {"desc": r['d'].get("1.0", tk.END).strip(), "sol": r['s'].get("1.0", tk.END).strip(),
                                  "time": r['t'].get().strip(), "release": r['r'].get().strip(), "due": r['du'].get().strip()}
        self.inject_data = new_data
        for t in self.teams: self._init_team_injects(t)
        self.setup_entry_form(); self.setup_management_tab()
        messagebox.showinfo("Success", "Inject grid saved.")

    def import_teams_csv(self):
        path = filedialog.askopenfilename(filetypes=[("CSV", "*.csv")])
        if not path: return
        try:
            with open(path, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get('Team Name') or row.get('Name')
                    if name: self.teams[name] = {"school": row.get('School Name', 'N/A'), "uptime": 0.0, "red_team": 0.0, "defense": 0.0, "injects": {}}
            self.setup_entry_form(); self.update_leaderboard(); self._refresh_scores_team_list(); self.update_scores_tab()
        except Exception as e: messagebox.showerror("Error", str(e))

    def import_injects_csv(self):
        path = filedialog.askopenfilename(filetypes=[("CSV", "*.csv")])
        if not path: return
        try:
            with open(path, newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    name = row.get('Description ') or row.get('Inject')
                    if name: self.inject_data[name] = {"desc": name, "sol": row.get('Solution', 'Key'), 
                                                       "time": row.get('Time to complete', '30'), 
                                                       "release": row.get('Approx Release Time', ''), "due": row.get('Approx Due Time', '')}
            for t in self.teams: self._init_team_injects(t)
            self.save_all_inject_config()
        except Exception as e: messagebox.showerror("Error", str(e))

    def save_team_data(self):
        sel = self.team_listbox.curselection()
        if not sel: return
        t = self.team_listbox.get(sel[0])
        try:
            for inj in self.inject_data:
                self.trigger_live_update(inj)
                w = self.entry_widgets[inj]
                raw, sub, late = float(w["p"].get() or 0), w["s"].get().strip(), int(w["l"].get() or 0)
                final = float(w["f"].cget("text"))
                self.teams[t]["injects"][inj] = {"raw": raw, "sub_time": sub, "late": late, "final": final}
            self.update_leaderboard(); self.update_scores_tab(); self.load_team_data()
            messagebox.showinfo("Saved", f"Scores saved for {t}")
        except Exception as e: messagebox.showerror("Error", str(e))

    def load_team_data(self, event=None):
        sel = self.team_listbox.curselection()
        if not sel: return
        t = self.team_listbox.get(sel[0]); d = self.teams[t]
        for inj in self.inject_data:
            if inj in self.entry_widgets:
                w = self.entry_widgets[inj]
                w["p"].delete(0, tk.END); w["p"].insert(0, str(d["injects"].get(inj, {}).get("raw", 10.0)))
                w["s"].delete(0, tk.END); w["s"].insert(0, str(d["injects"].get(inj, {}).get("sub_time", "")))
                w["l"].delete(0, tk.END); w["l"].insert(0, str(d["injects"].get(inj, {}).get("late", 0)))
                self.trigger_live_update(inj)

    def delete_inject(self, n):
        if n in self.inject_data: del self.inject_data[n]
        self.save_all_inject_config()

    def add_inject_row(self):
        idx = len(self.grid_rows) + 1
        n, t, r, du = ttk.Entry(self.gf, width=15), ttk.Entry(self.gf, width=8), ttk.Entry(self.gf, width=8), ttk.Entry(self.gf, width=8)
        n.grid(row=idx, column=0); t.grid(row=idx, column=3); r.grid(row=idx, column=4); du.grid(row=idx, column=5)
        d, s = tk.Text(self.gf, width=25, height=4), tk.Text(self.gf, width=25, height=4)
        d.grid(row=idx, column=1); s.grid(row=idx, column=2)
        self.grid_rows.append({'n': n, 'd': d, 's': s, 't': t, 'r': r, 'du': du})

    def update_channel_dropdown(self):
        ch = sorted(list(self.webhooks.keys()))
        self.channel_selector['values'] = ch
        if ch: self.channel_selector.current(0)

    def setup_leaderboard(self):
        c = ("Rank", "Team", "School", "Uptime %", "Injects", "Total")
        self.tree = ttk.Treeview(self.score_tab, columns=c, show="headings")
        for col in c: self.tree.heading(col, text=col); self.tree.column(col, width=120, anchor="center")
        self.tree.pack(fill='both', expand=True, padx=10, pady=10)

    def update_leaderboard(self):
        for item in self.tree.get_children(): self.tree.delete(item)
        res = []
        for n, d in self.teams.items():
            inj_t = sum(i["final"] for i in d["injects"].values())
            res.append((n, d["school"], d["uptime"], inj_t, inj_t + d["uptime"] + d["red_team"] + d["defense"]))
        res.sort(key=lambda x: x[4], reverse=True)
        for i, r in enumerate(res, 1): self.tree.insert("", "end", values=(i, r[0], r[1], f"{r[2]}%", f"{r[3]:.1f}", f"{r[4]:.1f}"))

    def export_json(self):
        p = filedialog.asksaveasfilename(defaultextension=".json")
        if p:
            with open(p, 'w') as f: json.dump({'teams': self.teams, 'inject_data': self.inject_data, 'webhooks': self.webhooks, 'broadcast_times': self.broadcast_times}, f, indent=4)

    def import_json(self):
        p = filedialog.askopenfilename(filetypes=[("JSON", "*.json")])
        if p:
            with open(p, 'r') as f:
                d = json.load(f); self.teams, self.inject_data, self.webhooks = d.get('teams', {}), d.get('inject_data', {}), d.get('webhooks', {})
                self.broadcast_times = d.get('broadcast_times', {})
            self.setup_entry_form(); self.setup_management_tab(); self.update_leaderboard(); self.update_scores_tab()

    def send_to_discord(self, inj_name):
        url = self.webhooks.get(self.channel_selector.get())
        if not url: return messagebox.showwarning("Warning", "Set webhook.")
        now = datetime.now().strftime("%H:%M:%S")
        self.broadcast_times[inj_name] = now
        info = self.inject_data[inj_name]
        payload = {"embeds": [{"title": f"🚀 INJECT: {inj_name}", "description": info['desc'], "color": 3447003, "fields": [{"name": "Duration", "value": f"{info['time']}m"}, {"name": "Due", "value": info['due']}]}]}
        try: requests.post(url, json=payload); self.setup_entry_form()
        except: pass

    def auto_save_loop(self):
        try:
            with open("autosave_scoreboard.json", 'w') as f: json.dump({'teams': self.teams, 'inject_data': self.inject_data, 'webhooks': self.webhooks, 'broadcast_times': self.broadcast_times}, f, indent=4)
        except: pass
        self.root.after(300000, self.auto_save_loop)

if __name__ == "__main__":
    root = tk.Tk(); app = CompetitionScoreboard(root); root.mainloop()
