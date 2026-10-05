package com.skynet.app;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import java.io.*;
import java.net.*;
import java.util.*;
import org.json.*;

public class MainActivity extends Activity {
    static final String BASE = "http://158.220.86.53:10000";
    static final int GOLD = Color.rgb(242,201,76);
    static final int BG = Color.rgb(5,5,5);
    LinearLayout root, content;
    TextView status;
    EditText search;
    SharedPreferences prefs;
    ArrayList<JSONObject> allMetas = new ArrayList<>();

    int dp(float n){ return (int)(n*getResources().getDisplayMetrics().density+0.5f); }

    TextView label(String s,float size,int color){
        TextView v=new TextView(this);
        v.setText(s); v.setTextColor(color); v.setTextSize(size); v.setTypeface(null,Typeface.BOLD);
        v.setGravity(Gravity.CENTER_VERTICAL);
        return v;
    }

    GradientDrawable bg(int color,float radius){
        GradientDrawable g=new GradientDrawable(); g.setColor(color); g.setCornerRadius(dp(radius)); return g;
    }

    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        getWindow().setStatusBarColor(BG); getWindow().setNavigationBarColor(BG);
        prefs=getSharedPreferences("skynet",0);

        root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(BG);
        root.setPadding(dp(16),dp(24),0,0);

        LinearLayout top=new LinearLayout(this); top.setGravity(Gravity.CENTER_VERTICAL);
        TextView logo=label("SKYNET",28,GOLD); logo.setLetterSpacing(.08f);
        top.addView(logo,new LinearLayout.LayoutParams(0,dp(54),1));

        search=new EditText(this);
        search.setHint("Search"); search.setHintTextColor(Color.GRAY); search.setTextColor(Color.WHITE);
        search.setSingleLine(true); search.setTextSize(15); search.setPadding(dp(14),0,dp(14),0);
        search.setBackground(bg(Color.rgb(25,25,25),dp(22)));
        LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(dp(130),dp(42)); sp.setMargins(0,0,dp(14),0);
        top.addView(search,sp); root.addView(top);

        search.setOnEditorActionListener((v,a,e)->{doSearch(v.getText().toString());return true;});
        search.setOnFocusChangeListener((v,has)->{ if(!has && search.getText().length()==0) showHome(); });

        ScrollView scroll=new ScrollView(this); scroll.setFillViewport(true);
        content=new LinearLayout(this); content.setOrientation(LinearLayout.VERTICAL); content.setPadding(0,0,0,dp(30));
        scroll.addView(content); root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));

        status=label("Connecting to Skynet VPS…",12,Color.GRAY); status.setPadding(0,dp(8),dp(16),dp(8));
        root.addView(status,new LinearLayout.LayoutParams(-1,dp(40)));
        setContentView(root); load();
    }

    void load(){
        new Thread(()->{
            try{
                ArrayList<JSONObject> first=new ArrayList<>();
                allMetas.clear();
                addCatalog(first,"movie","skynet-trending-movies.json","Trending");
                addCatalog(first,"movie","skynet-popular-movies.json","Popular Movies");
                addCatalog(first,"series","skynet-popular-series.json","Popular Series");
                runOnUiThread(()->render(first));
            }catch(Exception e){runOnUiThread(()->status.setText("Skynet connection error")); }
        }).start();
    }

    void addCatalog(ArrayList<JSONObject> rows,String type,String file,String name)throws Exception{
        JSONArray metas=new JSONObject(get(BASE+"/catalog/"+type+"/"+file)).optJSONArray("metas");
        if(metas==null)return;
        ArrayList<JSONObject> list=new ArrayList<>();
        for(int j=0;j<Math.min(20,metas.length());j++){
            JSONObject m=metas.getJSONObject(j); list.add(m); allMetas.add(m);
        }
        JSONObject row=new JSONObject(); row.put("type",type); row.put("name",name); row.put("metas",new JSONArray(list)); rows.add(row);
    }

    void render(ArrayList<JSONObject> rows){
        content.removeAllViews();
        if(rows.size()==0){ status.setText("No catalogue data returned"); return; }
        JSONObject hero=rows.get(0).optJSONArray("metas").optJSONObject(0);
        if(hero!=null) addHero(hero,rows.get(0).optString("type","movie"));
        if(prefs.contains("resume_id")) addResume();
        for(JSONObject r:rows){
            try{ addRow(r.optString("name","Skynet"),r.optString("type","movie"),r.getJSONArray("metas")); }catch(Exception ignored){}
        }
        status.setText("SKYNET • Connected");
    }

    void addHero(JSONObject m,String type){
        FrameLayout hero=new FrameLayout(this); hero.setBackgroundColor(Color.rgb(15,15,15));
        ImageView image=new ImageView(this); image.setScaleType(ImageView.ScaleType.CENTER_CROP);
        hero.addView(image,new FrameLayout.LayoutParams(-1,dp(270)));
        TextView shade=new TextView(this); shade.setBackground(bg(Color.argb(180,5,5,5),0));
        FrameLayout.LayoutParams sh=new FrameLayout.LayoutParams(-1,dp(270)); hero.addView(shade,sh);
        LinearLayout info=new LinearLayout(this); info.setOrientation(LinearLayout.VERTICAL); info.setGravity(Gravity.BOTTOM);
        info.setPadding(dp(18),0,dp(18),dp(18));
        TextView title=label(m.optString("name","Skynet"),28,Color.WHITE); info.addView(title,new LinearLayout.LayoutParams(-1,dp(48)));
        TextView desc=label(m.optString("description",""),13,Color.LTGRAY); desc.setMaxLines(2); info.addView(desc,new LinearLayout.LayoutParams(-1,dp(50)));
        LinearLayout buttons=new LinearLayout(this); buttons.setGravity(Gravity.LEFT);
        Button play=button("▶  PLAY",GOLD,Color.BLACK); Button more=button("+  MY LIST",Color.rgb(45,45,45),Color.WHITE);
        buttons.addView(play,new LinearLayout.LayoutParams(dp(125),dp(44))); LinearLayout.LayoutParams mp=new LinearLayout.LayoutParams(dp(125),dp(44)); mp.setMargins(dp(8),0,0,0); buttons.addView(more,mp);
        info.addView(buttons); hero.addView(info,new FrameLayout.LayoutParams(-1,dp(270)));
        play.setOnClickListener(v->play(type,m.optString("id"),m.optString("name")));
        more.setOnClickListener(v->toggleList(m));
        content.addView(hero,new LinearLayout.LayoutParams(-1,dp(270)));
        loadImage(image,m.optString("background",m.optString("poster")));
    }

    Button button(String s,int c,int tc){
        Button b=new Button(this); b.setText(s); b.setTextColor(tc); b.setTextSize(13); b.setAllCaps(false);
        b.setTypeface(null,Typeface.BOLD); b.setBackground(bg(c,dp(8))); b.setFocusable(true); b.setFocusableInTouchMode(true);
        return b;
    }

    void addRow(String name,String type,JSONArray metas){
        TextView title=label(name,21,Color.WHITE); title.setPadding(0,dp(18),0,dp(8));
        content.addView(title,new LinearLayout.LayoutParams(-1,dp(54)));
        HorizontalScrollView hs=new HorizontalScrollView(this); hs.setHorizontalScrollBarEnabled(false);
        LinearLayout line=new LinearLayout(this); line.setPadding(0,0,dp(12),0);
        for(int i=0;i<Math.min(20,metas.length());i++){
            JSONObject m=metas.optJSONObject(i); if(m==null)continue;
            FrameLayout card=new FrameLayout(this); card.setFocusable(true); card.setClickable(true);
            ImageView im=new ImageView(this); im.setScaleType(ImageView.ScaleType.CENTER_CROP); im.setBackground(bg(Color.rgb(30,30,30),dp(7)));
            card.addView(im,new FrameLayout.LayoutParams(dp(125),dp(185)));

            TextView nameText=label(m.optString("name",""),12,Color.WHITE);
            nameText.setGravity(Gravity.BOTTOM|Gravity.LEFT); nameText.setPadding(dp(7),0,dp(7),dp(7));
            GradientDrawable nameBg=new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                    new int[]{Color.TRANSPARENT,Color.argb(235,0,0,0)});
            nameText.setBackground(nameBg);
            FrameLayout.LayoutParams np=new FrameLayout.LayoutParams(-1,dp(65),Gravity.BOTTOM);
            card.addView(nameText,np);

            String id=m.optString("id","").toLowerCase(Locale.UK);
            TextView badge=label(id.contains("4k")?"4K":"HD",10,GOLD); badge.setGravity(Gravity.CENTER); badge.setBackground(bg(Color.argb(210,0,0,0),dp(5)));
            FrameLayout.LayoutParams bp=new FrameLayout.LayoutParams(dp(38),dp(25),Gravity.TOP|Gravity.RIGHT);
            bp.setMargins(0,dp(6),dp(5),0); card.addView(badge,bp);

            card.setOnClickListener(v->details(type,m));
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(dp(125),dp(185));
            cp.setMargins(0,0,dp(10),0); line.addView(card,cp);
            loadImage(im,m.optString("poster"));
        }
        hs.addView(line); content.addView(hs,new LinearLayout.LayoutParams(-1,dp(195)));
    }

    void details(String type,JSONObject m){
        final Dialog d=new Dialog(this); d.getWindow();
        LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(dp(18),dp(18),dp(18),dp(18)); box.setBackground(bg(Color.rgb(18,18,18),dp(12)));
        TextView t=label(m.optString("name","Title"),24,Color.WHITE); box.addView(t,new LinearLayout.LayoutParams(-1,dp(55)));
        TextView desc=label(m.optString("description","No description available."),14,Color.LTGRAY); desc.setMaxLines(5); box.addView(desc,new LinearLayout.LayoutParams(-1,dp(110)));
        LinearLayout bs=new LinearLayout(this); Button p=button("▶ PLAY",GOLD,Color.BLACK); Button f=button("+ MY LIST",Color.DKGRAY,Color.WHITE);
        bs.addView(p,new LinearLayout.LayoutParams(dp(120),dp(45))); LinearLayout.LayoutParams fp=new LinearLayout.LayoutParams(dp(120),dp(45)); fp.setMargins(dp(8),0,0,0); bs.addView(f,fp); box.addView(bs);
        p.setOnClickListener(v->{d.dismiss();play(type,m.optString("id"),m.optString("name"));}); f.setOnClickListener(v->toggleList(m));
        d.setContentView(box); Window w=d.getWindow(); if(w!=null)w.setBackgroundDrawableResource(android.R.color.transparent);
        d.show(); if(w!=null)w.setLayout(dp(360),WindowManager.LayoutParams.WRAP_CONTENT);
    }

    void toggleList(JSONObject m){
        String id=m.optString("id"); boolean has=prefs.getBoolean("fav_"+id,false);
        prefs.edit().putBoolean("fav_"+id,!has).apply();
        Toast.makeText(this,!has?"Added to My List":"Removed from My List",Toast.LENGTH_SHORT).show();
    }

    void addResume(){
        String name=prefs.getString("resume_name",""); if(name.length()==0)return;
        TextView t=label("Resume Watching",21,Color.WHITE); t.setPadding(0,dp(18),0,dp(8)); content.addView(t,new LinearLayout.LayoutParams(-1,dp(54)));
        Button b=button("▶  "+name+"   •   Continue",Color.rgb(30,30,30),Color.WHITE);
        b.setOnClickListener(v->play(prefs.getString("resume_type","movie"),prefs.getString("resume_id",""),name));
        content.addView(b,new LinearLayout.LayoutParams(-1,dp(55)));
    }

    void doSearch(String q){
        q=q.trim();
        if(q.length()==0){showHome();return;}
        content.removeAllViews();
        TextView h=label("Search results",22,Color.WHITE);
        h.setPadding(0,dp(15),0,dp(10));
        content.addView(h);
        status.setText("Searching Skynet…");
        final String query=q;
        new Thread(()->{
            try{
                String u=BASE+"/app/api/search?q="+URLEncoder.encode(query,"UTF-8");
                JSONObject data=new JSONObject(get(u));
                JSONArray results=data.optJSONArray("results");
                ArrayList<JSONObject> found=new ArrayList<>();
                if(results!=null){
                    for(int i=0;i<Math.min(30,results.length());i++){
                        JSONObject m=results.optJSONObject(i);
                        if(m!=null)found.add(m);
                    }
                }
                runOnUiThread(()->renderSearch(found));
            }catch(Exception e){
                runOnUiThread(()->{
                    status.setText("Search unavailable");
                    renderSearch(new ArrayList<>());
                });
            }
        }).start();
    }

    void renderSearch(ArrayList<JSONObject> found){
        content.removeViews(1,Math.max(0,content.getChildCount()-1));
        if(found.size()==0){
            TextView empty=label("No results found",17,Color.GRAY);
            empty.setPadding(0,dp(20),0,dp(20));
            content.addView(empty);
            status.setText("0 results");
            return;
        }
        LinearLayout grid=new LinearLayout(this);
        grid.setOrientation(LinearLayout.VERTICAL);
        LinearLayout row=null;
        for(int i=0;i<found.size();i++){
            if(i%3==0){
                row=new LinearLayout(this);
                row.setGravity(Gravity.LEFT);
                grid.addView(row,new LinearLayout.LayoutParams(-1,dp(185)));
            }
            JSONObject m=found.get(i);
            FrameLayout card=new FrameLayout(this);
            card.setFocusable(true); card.setClickable(true);
            ImageView im=new ImageView(this);
            im.setScaleType(ImageView.ScaleType.CENTER_CROP);
            im.setBackground(bg(Color.rgb(30,30,30),dp(7)));
            card.addView(im,new FrameLayout.LayoutParams(dp(105),dp(175)));
            TextView nt=label(m.optString("name",""),11,Color.WHITE);
            nt.setGravity(Gravity.BOTTOM|Gravity.LEFT);
            nt.setPadding(dp(6),0,dp(6),dp(6));
            nt.setMaxLines(2);
            nt.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                    new int[]{Color.TRANSPARENT,Color.argb(235,0,0,0)}));
            card.addView(nt,new FrameLayout.LayoutParams(dp(105),dp(58),Gravity.BOTTOM));
            card.setOnClickListener(v->details(m.optString("type","movie"),m));
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(dp(105),dp(175));
            cp.setMargins(0,0,dp(10),0);
            row.addView(card,cp);
            loadImage(im,m.optString("poster"));
        }
        content.addView(grid);
        status.setText(found.size()+" result(s)");
    }
    void showHome(){ search.setText(""); load(); }

    void play(String type,String id,String name){
        status.setText("Finding source for "+name+"…");
        prefs.edit().putString("resume_id",id).putString("resume_name",name).putString("resume_type",type).apply();
        new Thread(()->{try{
            JSONArray a=new JSONObject(get(BASE+"/stream/"+type+"/"+URLEncoder.encode(id,"UTF-8")+".json")).optJSONArray("streams");
            if(a==null||a.length()==0)throw new Exception();
            String u=a.getJSONObject(0).optString("url"); if(u.length()==0)throw new Exception();
            runOnUiThread(()->{status.setText("Playing "+name);startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(u)));});
        }catch(Exception e){runOnUiThread(()->status.setText("No playable source returned"));}}).start();
    }

    void loadImage(ImageView v,String url){ if(url==null||url.length()==0)return; new Thread(()->{try{
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection(); c.setConnectTimeout(8000); c.setReadTimeout(10000); c.connect();
        InputStream in=c.getInputStream(); Bitmap b=BitmapFactory.decodeStream(in); in.close(); if(b!=null)runOnUiThread(()->v.setImageBitmap(b));
    }catch(Exception ignored){}}).start(); }

    String get(String u)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(u).openConnection(); c.setConnectTimeout(10000); c.setReadTimeout(15000);
        BufferedReader b=new BufferedReader(new InputStreamReader(c.getInputStream())); StringBuilder s=new StringBuilder(); String l;
        while((l=b.readLine())!=null)s.append(l); b.close(); return s.toString();
    }
}
