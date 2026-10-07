package com.skynet.app;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.provider.Settings;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import androidx.media3.common.MediaItem;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;
import androidx.media3.datasource.DefaultDataSource;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import java.io.*;
import java.net.*;
import java.util.*;
import org.json.*;

public class MainActivity extends Activity {
    static final String BASE = "http://158.220.86.53:10000";
    static final int GOLD = Color.rgb(242,201,76);
    static final int FOCUS_BLUE = Color.rgb(33,150,243);
    static final int BG = Color.rgb(5,5,5);
    LinearLayout root, content;
    TextView status;
    EditText search;
    SharedPreferences prefs;
    ArrayList<JSONObject> allMetas = new ArrayList<>();
    // Tracks whether the user is on the main catalogue. Back from a sub-page
    // should return here instead of immediately leaving the app.
    boolean showingHome = true;
    int heroPlayId = View.NO_ID;
    ExoPlayer player;
    PlayerView playerView;

    int dp(float n){ return (int)(n*getResources().getDisplayMetrics().density+0.5f); }

    boolean isTv(){
        return (getResources().getConfiguration().uiMode & android.content.res.Configuration.UI_MODE_TYPE_MASK)
                == android.content.res.Configuration.UI_MODE_TYPE_TELEVISION;
    }

    void prepareTvNavigation(ScrollView scroll){
        scroll.setFocusable(false);
        scroll.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
        if(isTv()) search.setFocusable(false);
    }

    void focusFirstTvCard(){
        if(!isTv()) return;
        content.postDelayed(()->{
            // Always start at the top of the home page. Android TV can
            // automatically focus the first poster while the ScrollView is
            // laying out, which otherwise hides most of the hero.
            ViewParent p=content.getParent();
            while(p!=null && !(p instanceof ScrollView)) p=p.getParent();
            if(p instanceof ScrollView) ((ScrollView)p).scrollTo(0,0);

            if(heroPlayId!=View.NO_ID){
                View hero=content.findViewById(heroPlayId);
                if(hero!=null){
                    hero.setFocusable(true);
                    hero.requestFocus();
                    if(p instanceof ScrollView) ((ScrollView)p).scrollTo(0,0);
                    return;
                }
            }
            for(int i=0;i<content.getChildCount();i++){
                View v=content.getChildAt(i);
                View card=findFirstFocusable(v);
                if(card!=null){ card.requestFocus(); return; }
            }
        },450);
    }

    View findFirstFocusable(View v){
        if(v instanceof ViewGroup){
            ViewGroup g=(ViewGroup)v;
            for(int i=0;i<g.getChildCount();i++){
                View x=findFirstFocusable(g.getChildAt(i));
                if(x!=null)return x;
            }
        }
        if(v.isFocusable() && v.isClickable())return v;
        return null;
    }

    void styleTvCard(View card, View image){
        if(!isTv()) return;
        // Rounded TV cards: the card itself owns the rounded outline so the
        // poster/logo is clipped to the same corners. The blue focus ring
        // remains a foreground outline and does not cover the artwork.
        card.setBackground(bg(Color.TRANSPARENT,dp(12)));
        card.setClipToOutline(true);
        card.setOutlineProvider(new ViewOutlineProvider(){
            @Override public void getOutline(View v, Outline outline){
                outline.setRoundRect(0,0,v.getWidth(),v.getHeight(),dp(12));
            }
        });
        card.setOnFocusChangeListener((v,has)->{
            GradientDrawable border=new GradientDrawable();
            border.setColor(Color.TRANSPARENT);
            border.setCornerRadius(dp(12));
            // Subtle edge at rest; blue focus ring when selected.
            border.setStroke(dp(has?4:1), has?FOCUS_BLUE:Color.rgb(42,45,52));
            v.setForeground(border);
            if(has){
                v.animate().scaleX(1.06f).scaleY(1.06f).setDuration(100).start();
            }else{
                v.animate().scaleX(1f).scaleY(1f).setDuration(100).start();
            }
        });
    }

    TextView label(String s,float size,int color){
        TextView v=new TextView(this);
        v.setText(s); v.setTextColor(color); v.setTextSize(size); v.setTypeface(null,Typeface.BOLD);
        v.setGravity(Gravity.CENTER_VERTICAL);
        return v;
    }

    GradientDrawable bg(int color,float radius){
        GradientDrawable g=new GradientDrawable(); g.setColor(color); g.setCornerRadius(dp(radius)); return g;
    }

    LinearLayout addTvSidebar(){
        LinearLayout nav=new LinearLayout(this);
        nav.setOrientation(LinearLayout.VERTICAL);
        nav.setGravity(Gravity.TOP|Gravity.CENTER_HORIZONTAL);
        nav.setPadding(0,dp(18),dp(14),0);
        nav.setFocusable(false);

        String[] labels={"⌂","⌕","▣","⚙"};
        String[] names={"Home","Search","Library","Settings"};
        for(int i=0;i<labels.length;i++){
            TextView item=label(labels[i],23,Color.rgb(70,170,255));
            item.setGravity(Gravity.CENTER);
            item.setFocusable(true);
            item.setClickable(true);
            item.setBackground(bg(Color.TRANSPARENT,dp(14)));
            item.setContentDescription(names[i]);
            final int which=i;
            item.setOnFocusChangeListener((v,has)->{
                v.setBackground(has?bg(Color.rgb(18,85,145),dp(14)):bg(Color.TRANSPARENT,dp(14)));
                v.setScaleX(has?1.08f:1f); v.setScaleY(has?1.08f:1f);
            });
            item.setOnClickListener(v->{
                if(which==0) showHome();
                else if(which==1){ search.requestFocus(); }
                else status.setText(names[which]+" • Coming soon");
            });
            // Slightly smaller TV navigation icons, following Nuvio's
            // content-first sidebar approach while keeping them easy to see
            // and use with a D-pad from the sofa.
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(dp(56),dp(56));
            p.setMargins(0,dp(2),0,dp(10));
            nav.addView(item,p);
        }
        return nav;
    }

    LinearLayout skyflixBrand(float textSize){
        LinearLayout mark=new LinearLayout(this);
        mark.setOrientation(LinearLayout.HORIZONTAL);
        mark.setGravity(Gravity.CENTER_VERTICAL);

        TextView play=label("▶",textSize*0.92f,Color.rgb(35,175,255));
        mark.addView(play,new LinearLayout.LayoutParams(dp(textSize*1.35f),dp(textSize*1.72f)));

        TextView logo=label("SKYFLIX",textSize,Color.rgb(35,175,255));
        logo.setGravity(Gravity.CENTER_VERTICAL|Gravity.LEFT);
        logo.setTypeface(Typeface.create("sans-serif",Typeface.BOLD));
        logo.setLetterSpacing(0.01f);
        mark.addView(logo,new LinearLayout.LayoutParams(dp(textSize*6.4f),dp(textSize*1.72f)));
        return mark;
    }

    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        getWindow().setStatusBarColor(BG); getWindow().setNavigationBarColor(BG);
        prefs=getSharedPreferences("skynet",0);

        root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(BG);
        root.setPadding(dp(16),dp(24),0,0);

        LinearLayout top=new LinearLayout(this); top.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout skyflixLogo=skyflixBrand(28);
        top.addView(skyflixLogo,new LinearLayout.LayoutParams(0,dp(54),1));

        search=new EditText(this);
        search.setHint("Search"); search.setHintTextColor(Color.GRAY); search.setTextColor(Color.WHITE);
        search.setSingleLine(true); search.setTextSize(15); search.setPadding(dp(14),0,dp(14),0);
        search.setBackground(bg(Color.rgb(25,25,25),dp(22)));
        LinearLayout.LayoutParams sp=new LinearLayout.LayoutParams(dp(130),dp(42)); sp.setMargins(0,0,dp(14),0);
        top.addView(search,sp); root.addView(top);

        search.setOnEditorActionListener((v,a,e)->{doSearch(v.getText().toString());return true;});
        search.setOnFocusChangeListener((v,has)->{ if(!has && search.getText().length()==0) showHome(); });

        ScrollView scroll=new ScrollView(this); scroll.setFillViewport(true);
        prepareTvNavigation(scroll);
        content=new LinearLayout(this); content.setOrientation(LinearLayout.VERTICAL); content.setPadding(0,0,dp(16),dp(30));
        // The ScrollView must actually contain the catalogue. Without this,
        // the TV shell renders but the entire content area stays empty.
        scroll.addView(content,new ScrollView.LayoutParams(-1,-2));

        if(isTv()){
            LinearLayout tvBody=new LinearLayout(this);
            tvBody.setOrientation(LinearLayout.HORIZONTAL);
            tvBody.setGravity(Gravity.TOP);
            tvBody.addView(addTvSidebar(),new LinearLayout.LayoutParams(dp(78),-1));
            
            // Give the TV catalogue an explicit full-height container.
            // This avoids Android TV collapsing a nested weighted ScrollView.
            FrameLayout tvContent=new FrameLayout(this);
            tvContent.setBackgroundColor(BG);
            tvContent.addView(scroll,new FrameLayout.LayoutParams(
                    -1,-1,Gravity.TOP));
            LinearLayout.LayoutParams tvcp=new LinearLayout.LayoutParams(
                    0,-1,1);
            tvBody.addView(tvContent,tvcp);
            root.addView(tvBody,new LinearLayout.LayoutParams(-1,0,1));
        }else{
            root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        }

        status=label("Connecting to Skyflix VPS…",12,Color.GRAY); status.setPadding(0,dp(8),dp(16),dp(8));
        root.addView(status,new LinearLayout.LayoutParams(-1,dp(40)));
        setContentView(root);
        if(prefs.getString("license_code","").length()>0) load(); else showLogin();
    }

    @Override public void onBackPressed(){
        if(!showingHome){
            showingHome=true;
            showHome();
            return;
        }
        super.onBackPressed();
    }

    String deviceId(){
        return Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    }

    void showLogin(){
        content.removeAllViews();
        content.setGravity(Gravity.CENTER);

        LinearLayout box=new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);
        box.setPadding(dp(34),dp(36),dp(34),dp(36));
        box.setBackground(bg(Color.rgb(15,17,22),dp(22)));

        LinearLayout.LayoutParams card=new LinearLayout.LayoutParams(
                isTv()?dp(620):-1, ViewGroup.LayoutParams.WRAP_CONTENT);
        card.gravity=Gravity.CENTER;
        card.setMargins(dp(18),dp(30),dp(18),dp(30));

        LinearLayout logo=skyflixBrand(42);
        logo.setGravity(Gravity.CENTER);
        box.addView(logo,new LinearLayout.LayoutParams(-1,dp(66)));

        TextView welcome=label("WELCOME",18,Color.WHITE);
        welcome.setGravity(Gravity.CENTER);
        welcome.setTypeface(null,android.graphics.Typeface.BOLD);
        box.addView(welcome,new LinearLayout.LayoutParams(-1,dp(38)));

        TextView sub=label("Activate your device to continue",15,Color.LTGRAY);
        sub.setGravity(Gravity.CENTER);
        box.addView(sub,new LinearLayout.LayoutParams(-1,dp(42)));

        TextView hint=label("Enter the 12-character licence code supplied to you",13,Color.GRAY);
        hint.setGravity(Gravity.CENTER);
        hint.setPadding(0,dp(6),0,dp(8));
        box.addView(hint,new LinearLayout.LayoutParams(-1,dp(48)));

        EditText code=new EditText(this);
        code.setHint("XXXX-XXXX-XXXX");
        code.setHintTextColor(Color.rgb(100,105,115));
        code.setTextColor(Color.WHITE);
        code.setTextSize(21);
        code.setGravity(Gravity.CENTER);
        code.setSingleLine(true);
        code.setLetterSpacing(.08f);
        code.setPadding(dp(16),0,dp(16),0);
        code.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS);
        code.setBackground(bg(Color.rgb(25,28,35),dp(12)));
        box.addView(code,new LinearLayout.LayoutParams(-1,dp(64)));

        Button login=button("ACTIVATE SKYFLIX",Color.rgb(255,64,80),Color.WHITE);
        login.setTextSize(16);
        login.setAllCaps(false);
        login.setTypeface(null,android.graphics.Typeface.BOLD);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(isTv()?dp(250):-1,dp(54));
        lp.setMargins(0,dp(20),0,0);
        box.addView(login,lp);

        TextView msg=label("",14,Color.GRAY);
        msg.setGravity(Gravity.CENTER);
        msg.setPadding(0,dp(8),0,0);
        box.addView(msg,new LinearLayout.LayoutParams(-1,dp(52)));

        TextView privacy=label("Your licence is locked to this device.",12,Color.DKGRAY);
        privacy.setGravity(Gravity.CENTER);
        box.addView(privacy,new LinearLayout.LayoutParams(-1,dp(30)));

        login.setOnFocusChangeListener((v,has)->{
            if(isTv()) v.setBackground(has?bg(Color.rgb(255,90,105),dp(10)):bg(Color.rgb(255,64,80),dp(10)));
        });

        login.setOnClickListener(v->{
            String entered=code.getText().toString().trim().toUpperCase(Locale.UK).replace(" ","");
            if(entered.length()==0){msg.setText("Enter your licence code");return;}
            login.setEnabled(false);
            msg.setText("Activating device…");
            new Thread(()->{
                try{
                    JSONObject body=new JSONObject(); body.put("code",entered);
                    JSONObject reply=new JSONObject(postJson(BASE+"/app/api/login",body.toString()));
                    if(reply.optBoolean("ok")) runOnUiThread(()->{
                        prefs.edit().putString("license_code",entered).apply();
                        msg.setText("Activation successful ✓");
                        load();
                    });
                    else runOnUiThread(()->{
                        login.setEnabled(true);
                        msg.setText(loginError(reply.optString("error")));
                    });
                }catch(Exception e){
                    runOnUiThread(()->{
                        login.setEnabled(true);
                        msg.setText("Could not connect to Skyflix");
                    });
                }
            }).start();
        });

        content.addView(box,card);
        code.requestFocus();
        if(isTv()){
            code.setNextFocusDownId(login.getId());
            login.setNextFocusUpId(code.getId());
        }
        status.setText("SKYFLIX • Activation required");
    }

    String loginError(String e){
        if("INVALID_CODE".equals(e))return "Invalid login code";
        if("DEVICE_LIMIT".equals(e))return "This code is already registered to another device";
        if("EXPIRED".equals(e))return "This login code has expired";
        if("SUSPENDED".equals(e))return "This login code has been suspended";
        return "Login failed";
    }

    String postJson(String u,String body)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(u).openConnection(); c.setRequestMethod("POST"); c.setConnectTimeout(10000); c.setReadTimeout(15000); c.setDoOutput(true); c.setRequestProperty("Content-Type","application/json"); c.setRequestProperty("X-Skyflix-Device",deviceId());
        c.getOutputStream().write(body.getBytes("UTF-8")); c.getOutputStream().close();
        InputStream in=c.getResponseCode()>=400?c.getErrorStream():c.getInputStream(); BufferedReader b=new BufferedReader(new InputStreamReader(in)); StringBuilder s=new StringBuilder(); String l; while((l=b.readLine())!=null)s.append(l); b.close(); return s.toString();
    }

    void load(){
        showingHome=true;
        // Show the first catalogue as soon as it arrives. The old loader waited
        // for every catalogue before rendering anything, making Fire TV appear
        // frozen while the VPS was contacted repeatedly.
        new Thread(()->{
            try{
                ArrayList<JSONObject> first=new ArrayList<>();
                allMetas.clear();
                addCatalog(first,"movie","skynet-trending-movies.json","Trending");
                runOnUiThread(()->{
                    render(first);
                    status.setText("SKYFLIX • Connected");
                    reportDiagnostic("startup","home_loaded");
                    focusFirstTvCard();
                });

                // Load the remaining catalogues after the UI is already usable.
                ArrayList<JSONObject> more=new ArrayList<>();
                addCatalog(more,"movie","skynet-popular-movies.json","Popular Movies");
                addCatalog(more,"series","skynet-popular-series.json","Popular Series");
                addManifestCatalogs(more);
                runOnUiThread(()->{
                    first.addAll(more);
                    render(first);
                    status.setText("SKYFLIX • Connected");
                    focusFirstTvCard();
                });
            }catch(Exception e){
                runOnUiThread(()->{
                    if(content.getChildCount()==0) status.setText("Skyflix connection error");
                    reportDiagnostic("api_error","home_load_failed");
                });
            }
        }).start();
    }

    void addManifestCatalogs(ArrayList<JSONObject> rows)throws Exception{
        JSONObject manifest=new JSONObject(get(BASE+"/manifest.json"));
        JSONArray catalogs=manifest.optJSONArray("catalogs");
        if(catalogs==null)return;

        HashSet<String> seen=new HashSet<>();
        for(JSONObject r:rows){
            seen.add(r.optString("type","movie")+"|"+r.optString("name","").toLowerCase(Locale.UK));
        }

        for(int i=0;i<catalogs.length();i++){
            JSONObject cat=catalogs.optJSONObject(i);
            if(cat==null)continue;

            String type=cat.optString("type","movie");
            String id=cat.optString("id","");
            String name=cat.optString("name",id);
            if(id.length()==0||name.length()==0)continue;

            String key=type+"|"+name.toLowerCase(Locale.UK);
            if(seen.contains(key))continue;

            // The manifest defines the exact catalogue route. If a catalogue
            // is empty or unavailable, skip it without stopping the others.
            try{
                JSONArray metas=new JSONObject(get(BASE+"/catalog/"+type+"/"+id+".json")).optJSONArray("metas");
                if(metas==null||metas.length()==0)continue;

                ArrayList<JSONObject> list=new ArrayList<>();
                for(int j=0;j<Math.min(20,metas.length());j++){
                    JSONObject m=metas.optJSONObject(j);
                    if(m!=null){list.add(m);allMetas.add(m);}
                }
                if(list.size()==0)continue;

                JSONObject row=new JSONObject();
                row.put("type",type);
                row.put("name",name);
                row.put("metas",new JSONArray(list));
                rows.add(row);
                seen.add(key);
            }catch(Exception ignored){}
        }
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
        if(hero!=null) addHero(hero,rows.get(0).optString("type","movie"), rows.get(0).optJSONArray("metas"));

        // Put all streaming-service shortcuts directly underneath the hero.
        for(JSONObject r:rows){
            if("Streaming Services".equalsIgnoreCase(r.optString("name",""))){
                try{ addServiceBar(r.optString("type","movie"),r.getJSONArray("metas")); }catch(Exception ignored){}
                break;
            }
        }
        addMyList();
        for(JSONObject r:rows){
            if("Streaming Services".equalsIgnoreCase(r.optString("name",""))) continue;
            try{ addRow(r.optString("name","Skyflix"),r.optString("type","movie"),r.getJSONArray("metas")); }catch(Exception ignored){}
        }
        status.setText("SKYFLIX • Connected");
    }

    void addHero(JSONObject m,String type,JSONArray heroMetas){
        // Give the main hero much more screen space on Fire TV while keeping
        // the compact layout on phones/tablets.
        int heroH=isTv()?300:250;
        FrameLayout hero=new FrameLayout(this); hero.setBackground(bg(Color.rgb(15,15,15),dp(14))); hero.setClipToOutline(true);
        hero.setId(View.generateViewId());
        heroPlayId=hero.getId();
        hero.setFocusable(true);
        hero.setClickable(true);
        hero.setOnFocusChangeListener((v,has)->{
            GradientDrawable b=new GradientDrawable();
            b.setColor(Color.TRANSPARENT);
            b.setCornerRadius(dp(14));
            b.setStroke(dp(has?3:1),has?FOCUS_BLUE:Color.rgb(42,45,52));
            v.setForeground(b);
            v.animate().scaleX(has?1.015f:1f).scaleY(has?1.015f:1f).setDuration(100).start();
        });
        hero.setOnClickListener(v->details(type,m));
        hero.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
        ImageView image=new ImageView(this); image.setScaleType(ImageView.ScaleType.CENTER_CROP);
        hero.addView(image,new FrameLayout.LayoutParams(-1,dp(heroH)));
        TextView shade=new TextView(this); shade.setBackground(bg(Color.argb(180,5,5,5),0));
        FrameLayout.LayoutParams sh=new FrameLayout.LayoutParams(-1,dp(heroH)); hero.addView(shade,sh);
        LinearLayout info=new LinearLayout(this); info.setOrientation(LinearLayout.VERTICAL); info.setGravity(Gravity.BOTTOM);
        info.setPadding(dp(18),0,dp(18),dp(22));
        TextView title=label(m.optString("name","Skyflix"),28,Color.WHITE); info.addView(title,new LinearLayout.LayoutParams(-1,dp(52)));
        TextView rating=label(ratingText(m),14,GOLD); info.addView(rating,new LinearLayout.LayoutParams(-1,dp(28)));
        TextView desc=label(m.optString("description",""),13,Color.LTGRAY); desc.setMaxLines(2); info.addView(desc,new LinearLayout.LayoutParams(-1,dp(56)));
        hero.addView(info,new FrameLayout.LayoutParams(-1,dp(heroH)));
        content.addView(hero,new LinearLayout.LayoutParams(-1,dp(heroH)));

        loadImage(image,m.optString("background",m.optString("poster")));

        // Rotate the hero artwork automatically on the TV/home screen.
        if(heroMetas!=null && heroMetas.length()>1){
            final int[] heroIndex={0};
            hero.postDelayed(new Runnable(){
                @Override public void run(){
                    heroIndex[0]=(heroIndex[0]+1)%Math.min(heroMetas.length(),10);
                    JSONObject next=heroMetas.optJSONObject(heroIndex[0]);
                    if(next!=null){
                        title.setText(next.optString("name","Skyflix"));
                        desc.setText(next.optString("description",""));
                        loadImage(image,next.optString("background",next.optString("poster")));
                    }
                    hero.postDelayed(this,10000);
                }
            },7000);
        }
    }

    void addServiceBar(String type,JSONArray metas){
        if(metas==null||metas.length()==0)return;
        HorizontalScrollView hs=new HorizontalScrollView(this);
        hs.setHorizontalScrollBarEnabled(false);
        hs.setFocusable(false);
        LinearLayout line=new LinearLayout(this);
        line.setGravity(Gravity.CENTER_VERTICAL);
        line.setPadding(0,dp(2),dp(12),dp(2));

        for(int i=0;i<metas.length();i++){
            JSONObject m=metas.optJSONObject(i);
            if(m==null)continue;
            String serviceId=m.optString("id","");
            if(!serviceId.startsWith("skynet-service:"))continue;

            FrameLayout card=new FrameLayout(this);
            card.setFocusable(true);
            card.setClickable(true);

            ImageView im=new ImageView(this);
            // The provider artwork already contains its own logo and wording.
            // Show the complete artwork inside the tile — never crop it or
            // overlay another service name on top.
            im.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
            im.setAdjustViewBounds(true);
            im.setPadding(dp(4),dp(4),dp(4),dp(4));
            im.setBackground(bg(Color.rgb(28,28,28),dp(12)));
            int serviceW=isTv()?140:82, serviceH=isTv()?62:50;
            card.addView(im,new FrameLayout.LayoutParams(dp(serviceW),dp(serviceH)));

            card.setOnClickListener(v->openServiceCatalog(
                    serviceId.substring("skynet-service:".length()),type));
            styleTvCard(card,im);

            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(
                    dp(serviceW),dp(serviceH));
            cp.setMargins(0,0,dp(isTv()?8:6),0);
            line.addView(card,cp);
            loadImage(im,m.optString("poster"));
        }
        hs.addView(line);
        content.addView(hs,new LinearLayout.LayoutParams(-1,dp(isTv()?78:58)));
    }

    Button button(String s,int c,int tc){
        Button b=new Button(this); b.setText(s); b.setTextColor(tc); b.setTextSize(13); b.setAllCaps(false);
        b.setTypeface(null,Typeface.BOLD); b.setBackground(bg(c,dp(8))); b.setFocusable(true); b.setFocusableInTouchMode(false);
        return b;
    }

    String tileArtwork(JSONObject m){
        // Prefer the landscape/backdrop artwork for TV tiles. A portrait poster
        // cropped into a 16:9 tile can lose faces, titles and important artwork.
        String bgUrl=m.optString("background","").trim();
        if(bgUrl.length()>0)return bgUrl;
        return m.optString("poster","");
    }

    void addRow(String name,String type,JSONArray metas){
        TextView title=label(name,21,Color.WHITE); title.setPadding(0,dp(18),0,dp(8));
        content.addView(title,new LinearLayout.LayoutParams(-1,dp(54)));

        if(isTv()){
            // Nuvio-style TV catalogue shelf: every catalogue is its own
            // horizontally scrolling category, with a See All tile at the end.
            HorizontalScrollView hs=new HorizontalScrollView(this);
            hs.setHorizontalScrollBarEnabled(false);
            hs.setFocusable(false);
            hs.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
            LinearLayout line=new LinearLayout(this);
            line.setPadding(dp(6),0,dp(24),0);
            line.setGravity(Gravity.CENTER_VERTICAL);

            final int cardW=130;
            final int cardH=190;
            final int gap=10;
            for(int i=0;i<Math.min(50,metas.length());i++){
                JSONObject m=metas.optJSONObject(i); if(m==null)continue;
                LinearLayout card=new LinearLayout(this);
                card.setOrientation(LinearLayout.VERTICAL);
                card.setFocusable(true); card.setClickable(true);

                ImageView im=new ImageView(this);
                im.setScaleType(ImageView.ScaleType.CENTER_CROP);
                im.setBackground(bg(Color.rgb(30,30,30),dp(12)));
                card.addView(im,new LinearLayout.LayoutParams(dp(cardW),dp(cardH)));

                TextView nameText=label(m.optString("name",""),14,Color.WHITE);
                nameText.setGravity(Gravity.CENTER_VERTICAL|Gravity.LEFT);
                nameText.setPadding(dp(5),0,dp(5),0);
                nameText.setMaxLines(1);
                nameText.setEllipsize(android.text.TextUtils.TruncateAt.END);
                LinearLayout.LayoutParams nl=new LinearLayout.LayoutParams(dp(cardW),dp(31));
                nl.topMargin=dp(7);
                card.addView(nameText,nl);

                TextView year=label(m.optString("releaseInfo",""),12,Color.LTGRAY);
                year.setGravity(Gravity.CENTER_VERTICAL|Gravity.LEFT);
                year.setPadding(dp(5),0,0,0);
                card.addView(year,new LinearLayout.LayoutParams(dp(cardW),dp(21)));

                card.setOnClickListener(v->details(type,m));
                styleTvCard(card,im);
                LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(dp(cardW),dp(cardH+59));
                cp.setMargins(0,0,dp(gap),dp(8));
                line.addView(card,cp);
                loadImage(im,tileArtwork(m));
                if(i==0) card.setNextFocusUpId(heroPlayId);
            }

            // Nuvio-style See All affordance at the end of every category.
            TextView seeAll=label("See All  ›",15,FOCUS_BLUE);
            seeAll.setGravity(Gravity.CENTER);
            seeAll.setFocusable(true); seeAll.setClickable(true);
            seeAll.setBackground(bg(Color.rgb(20,20,20),dp(12)));
            seeAll.setOnFocusChangeListener((v,has)->v.setBackground(
                    bg(has?Color.rgb(18,75,130):Color.rgb(20,20,20),dp(12))));
            seeAll.setOnClickListener(v->status.setText(name+" • Full catalogue coming next"));
            line.addView(seeAll,new LinearLayout.LayoutParams(dp(130),dp(90)));

            hs.addView(line);
            content.addView(hs,new LinearLayout.LayoutParams(-1,dp(cardH+72)));
            return;
        }

        // Phone/tablet keeps the compact horizontal scrolling layout.
        HorizontalScrollView hs=new HorizontalScrollView(this);
        hs.setHorizontalScrollBarEnabled(false);
        hs.setFocusable(false);
        hs.setDescendantFocusability(ViewGroup.FOCUS_AFTER_DESCENDANTS);
        LinearLayout line=new LinearLayout(this);
        line.setPadding(0,0,dp(12),0);
        line.setFocusable(false);

        for(int i=0;i<Math.min(50,metas.length());i++){
            JSONObject m=metas.optJSONObject(i); if(m==null)continue;
            FrameLayout card=new FrameLayout(this); card.setFocusable(true); card.setClickable(true);
            int cardW=125, cardH=185;
            String serviceId=m.optString("id","");
            boolean serviceCard=serviceId.startsWith("skynet-service:");
            ImageView im=new ImageView(this);
            im.setScaleType(serviceCard?ImageView.ScaleType.CENTER_INSIDE:ImageView.ScaleType.CENTER_CROP);
            im.setBackground(bg(Color.rgb(30,30,30),dp(10)));
            if(serviceCard) im.setPadding(dp(14),dp(8),dp(14),dp(8));
            card.addView(im,new FrameLayout.LayoutParams(dp(cardW),dp(cardH)));

            TextView nameText=label(m.optString("name",""),12,Color.WHITE);
            nameText.setGravity(Gravity.BOTTOM|Gravity.LEFT);
            nameText.setPadding(dp(7),0,dp(7),dp(7));
            nameText.setMaxLines(2);
            nameText.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                    new int[]{Color.TRANSPARENT,Color.argb(235,0,0,0)}));
            card.addView(nameText,new FrameLayout.LayoutParams(-1,dp(65),Gravity.BOTTOM));

            String id=m.optString("id","").toLowerCase(Locale.UK);
            TextView badge=label(id.contains("4k")?"4K":"HD",10,GOLD);
            badge.setGravity(Gravity.CENTER);
            badge.setBackground(bg(Color.argb(210,0,0,0),dp(5)));
            FrameLayout.LayoutParams bp=new FrameLayout.LayoutParams(dp(38),dp(25),Gravity.TOP|Gravity.RIGHT);
            bp.setMargins(0,dp(6),dp(5),0);
            card.addView(badge,bp);

            if(serviceCard){
                card.setOnClickListener(v->openServiceCatalog(
                        serviceId.substring("skynet-service:".length()),type));
            }else{
                card.setOnClickListener(v->details(type,m));
            }
            styleTvCard(card,im);
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(dp(cardW),dp(cardH));
            cp.setMargins(0,0,dp(10),0);
            line.addView(card,cp);
            loadImage(im,tileArtwork(m));
        }
        hs.addView(line);
        content.addView(hs,new LinearLayout.LayoutParams(-1,dp(195)));
    }

    void openServiceCatalog(String slug,String type){
        showingHome=false;
        String catalogId="skynet-"+slug+"-"+(type.equals("series")?"series":"movies");
        String url=BASE+"/catalog/"+type+"/"+catalogId+".json";
        status.setText("Opening "+slug.replace("-"," ")+"…");
        new Thread(()->{
            try{
                JSONObject data=new JSONObject(get(url));
                JSONArray metas=data.optJSONArray("metas");
                ArrayList<JSONObject> list=new ArrayList<>();
                if(metas!=null) for(int i=0;i<metas.length();i++){
                    JSONObject x=metas.optJSONObject(i);
                    if(x!=null) list.add(x);
                }
                JSONObject row=new JSONObject();
                row.put("type",type);
                row.put("name",slug.equals("prime-video")?"Prime Video":slug.equals("disney-plus")?"Disney+":slug.equals("apple-tv-plus")?"Apple TV+":slug.equals("bbc-iplayer")?"BBC iPlayer":slug.equals("channel-4")?"Channel 4":slug.equals("itvx")?"ITVX":slug.equals("paramount-plus")?"Paramount+":slug.equals("netflix")?"Netflix":slug.equals("max")?"Max":slug);
                row.put("metas",new JSONArray(list));
                ArrayList<JSONObject> rows=new ArrayList<>();
                rows.add(row);
                runOnUiThread(()->render(rows));
            }catch(Exception e){
                runOnUiThread(()->status.setText("Could not open streaming service"));
            }
        }).start();
    }

    void details(String type,JSONObject m){
        if(!"series".equals(type)){
            final Dialog d=new Dialog(this); d.getWindow();
            LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(dp(18),dp(18),dp(18),dp(18)); box.setBackground(bg(Color.rgb(18,18,18),dp(12)));
            TextView t=label(m.optString("name","Title"),24,Color.WHITE); box.addView(t,new LinearLayout.LayoutParams(-1,dp(55)));
            TextView rt=label(ratingText(m),14,GOLD); box.addView(rt,new LinearLayout.LayoutParams(-1,dp(30)));
            TextView desc=label(m.optString("description","No description available."),14,Color.LTGRAY); desc.setMaxLines(5); box.addView(desc,new LinearLayout.LayoutParams(-1,dp(110)));
            LinearLayout bs=new LinearLayout(this); Button p=button("▶ PLAY",GOLD,Color.BLACK); Button f=button("+ MY LIST",Color.DKGRAY,Color.WHITE);
            bs.addView(p,new LinearLayout.LayoutParams(dp(120),dp(45))); LinearLayout.LayoutParams fp=new LinearLayout.LayoutParams(dp(120),dp(45)); fp.setMargins(dp(8),0,0,0); bs.addView(f,fp); box.addView(bs);
            p.setOnClickListener(v->{d.dismiss();play(type,m.optString("id"),m.optString("name"));}); f.setOnClickListener(v->toggleList(m));
            d.setContentView(box); Window w=d.getWindow(); if(w!=null)w.setBackgroundDrawableResource(android.R.color.transparent);
            d.show(); if(w!=null)w.setLayout(dp(360),WindowManager.LayoutParams.WRAP_CONTENT);
            return;
        }

        final Dialog d=new Dialog(this);
        LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(18),dp(18),dp(18),dp(18)); box.setBackground(bg(Color.rgb(18,18,18),dp(12)));
        TextView title=label(m.optString("name","Series"),24,Color.WHITE); box.addView(title,new LinearLayout.LayoutParams(-1,dp(52)));
        TextView rt=label(ratingText(m),14,GOLD); box.addView(rt,new LinearLayout.LayoutParams(-1,dp(30)));
        TextView loading=label("Loading seasons…",14,Color.LTGRAY); box.addView(loading,new LinearLayout.LayoutParams(-1,dp(42)));
        d.setContentView(box);
        Window w=d.getWindow(); if(w!=null)w.setBackgroundDrawableResource(android.R.color.transparent);
        d.show(); if(w!=null)w.setLayout(dp(isTv()?620:360),WindowManager.LayoutParams.WRAP_CONTENT);

        new Thread(()->{
            try{
                JSONObject data=new JSONObject(get(BASE+"/app/api/details?type=series&id="+URLEncoder.encode(m.optString("id"),"UTF-8")));
                JSONArray seasons=data.optJSONArray("seasons");
                runOnUiThread(()->{
                    box.removeView(loading);
                    if(seasons==null||seasons.length()==0){
                        box.addView(label("No seasons found",14,Color.LTGRAY));
                        return;
                    }
                    LinearLayout seasonRow=new LinearLayout(this); seasonRow.setOrientation(LinearLayout.HORIZONTAL);
                    TextView sh=label("Season:",15,Color.WHITE); seasonRow.addView(sh,new LinearLayout.LayoutParams(dp(80),dp(48)));
                    for(int i=0;i<seasons.length();i++){
                        JSONObject s=seasons.optJSONObject(i); if(s==null)continue;
                        int sn=s.optInt("season",s.optInt("season_number",1));
                        Button sb=button("S"+sn,Color.rgb(45,45,45),Color.WHITE);
                        sb.setOnClickListener(v->loadEpisodesIntoDialog(box,m,sn,d));
                        seasonRow.addView(sb,new LinearLayout.LayoutParams(dp(70),dp(48)));
                    }
                    box.addView(seasonRow);
                    loadEpisodesIntoDialog(box,m,seasons.optJSONObject(0).optInt("season",1),d);
                });
            }catch(Exception e){ runOnUiThread(()->loading.setText("Could not load seasons")); }
        }).start();
    }

    void loadEpisodesIntoDialog(LinearLayout box, JSONObject series, int season, Dialog d){
        while(box.getChildCount()>2)box.removeViewAt(2);
        TextView loading=label("Loading episodes…",14,Color.LTGRAY); box.addView(loading);
        new Thread(()->{
            try{
                JSONObject data=new JSONObject(get(BASE+"/app/api/episodes?id="+URLEncoder.encode(series.optString("id"),"UTF-8")+"&season="+season));
                JSONArray eps=data.optJSONArray("episodes");
                runOnUiThread(()->{
                    box.removeView(loading);
                    if(eps==null||eps.length()==0){box.addView(label("No episodes found",14,Color.LTGRAY));return;}
                    for(int i=0;i<eps.length();i++){
                        JSONObject ep=eps.optJSONObject(i); if(ep==null)continue;
                        int en=ep.optInt("episode",i+1);
                        Button eb=button("E"+en+"  "+ep.optString("name","Episode "+en),Color.rgb(35,35,35),Color.WHITE);
                        eb.setGravity(Gravity.LEFT|Gravity.CENTER_VERTICAL);
                        eb.setOnClickListener(v->{d.dismiss();playSeriesPlaylist(series.optString("id"),season,en,series.optString("name","Series"));});
                        box.addView(eb,new LinearLayout.LayoutParams(-1,dp(48)));
                    }
                });
            }catch(Exception e){runOnUiThread(()->loading.setText("Could not load episodes"));}
        }).start();
    }

    void playSeriesPlaylist(String id,int season,int episode,String name){
        status.setText("Preparing episode playlist…");
        prefs.edit().putString("resume_id",id+":"+season+":"+episode).putString("resume_name",name+" • S"+season+" E"+episode).putString("resume_type","series").apply();
        new Thread(()->{
            try{
                String u=BASE+"/app/api/series-playlist?id="+URLEncoder.encode(id,"UTF-8")+"&season="+season+"&episode="+episode;
                // Series now uses the same internal Media3 player path.
                // The playlist endpoint remains available for compatibility,
                // but Skyflix no longer launches VLC.
                runOnUiThread(()->{
                    try{
                        startInternalPlayer(u,name+" • S"+season+" E"+episode,null);
                        status.setText("Playing "+name+" • S"+season+" E"+episode);
                    }catch(Exception ex){
                        status.setText("Could not play this series");
                        Toast.makeText(this,"Skyflix could not play the series",Toast.LENGTH_LONG).show();
                    }
                });
            }catch(Exception e){runOnUiThread(()->status.setText("Could not prepare series playlist"));}
        }).start();
    }

    String ratingText(JSONObject m){
        if(m==null)return "★ -";
        double r=m.optDouble("imdbRating",0);
        if(r<=0)return "★ -";
        return String.format(Locale.UK,"★ %.1f",r);
    }

    void toggleList(JSONObject m){
        String id=m.optString("id"); boolean has=prefs.getBoolean("fav_"+id,false);
        prefs.edit().putBoolean("fav_"+id,!has).apply();
        Toast.makeText(this,!has?"Added to My List":"Removed from My List",Toast.LENGTH_SHORT).show();
    }

    void addMyList(){
        ArrayList<JSONObject> favs=new ArrayList<>();
        for(JSONObject m:allMetas){
            String id=m.optString("id","");
            if(id.length()>0 && prefs.getBoolean("fav_"+id,false)){
                boolean duplicate=false;
                for(JSONObject x:favs) if(id.equals(x.optString("id",""))){duplicate=true;break;}
                if(!duplicate) favs.add(m);
            }
        }
        if(favs.size()==0)return;
        TextView t=label("My List",21,Color.WHITE);
        t.setPadding(0,dp(18),0,dp(8));
        content.addView(t,new LinearLayout.LayoutParams(-1,dp(54)));
        HorizontalScrollView hs=new HorizontalScrollView(this);
        hs.setHorizontalScrollBarEnabled(false);
        LinearLayout line=new LinearLayout(this);
        line.setPadding(0,0,dp(12),0);
        for(JSONObject m:favs){
            FrameLayout card=new FrameLayout(this);
            card.setFocusable(true); card.setClickable(true);
            ImageView im=new ImageView(this);
            String serviceId=m.optString("id","");
            boolean serviceCard=serviceId.startsWith("skynet-service:");
            im.setScaleType(serviceCard?ImageView.ScaleType.CENTER_INSIDE:ImageView.ScaleType.CENTER_CROP);
            im.setBackground(bg(Color.rgb(30,30,30),dp(10)));
            if(serviceCard) im.setPadding(dp(14),dp(8),dp(14),dp(8));
            card.addView(im,new FrameLayout.LayoutParams(dp(isTv()?200:125),dp(isTv()?112:185)));
            card.setClipToOutline(true);
            TextView nt=label(ratingText(m)+"  "+m.optString("name",""),12,Color.WHITE);
            nt.setGravity(Gravity.BOTTOM|Gravity.LEFT);
            nt.setPadding(dp(7),0,dp(7),dp(7));
            nt.setMaxLines(2);
            nt.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                    new int[]{Color.TRANSPARENT,Color.argb(235,0,0,0)}));
            card.addView(nt,new FrameLayout.LayoutParams(-1,dp(isTv()?42:65),Gravity.BOTTOM));
            card.setOnClickListener(v->details(m.optString("type","movie"),m));
            styleTvCard(card,im);
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(dp(125),dp(185));
            cp.setMargins(0,0,dp(10),0);
            line.addView(card,cp);
            loadImage(im,tileArtwork(m));
        }
        hs.addView(line);
        content.addView(hs,new LinearLayout.LayoutParams(-1,dp(195)));
    }

    void doSearch(String q){
        q=q.trim();
        showingHome=false;
        if(q.length()==0){showHome();return;}
        content.removeAllViews();
        TextView h=label("Search results",22,Color.WHITE);
        h.setPadding(0,dp(15),0,dp(10));
        content.addView(h);
        status.setText("Searching Skyflix…");
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
                runOnUiThread(()->{ renderSearch(found); focusFirstTvCard(); });
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
            card.addView(im,new FrameLayout.LayoutParams(dp(isTv()?180:105),dp(isTv()?105:175)));
            TextView nt=label(ratingText(m)+"  "+m.optString("name",""),11,Color.WHITE);
            nt.setGravity(Gravity.BOTTOM|Gravity.LEFT);
            nt.setPadding(dp(6),0,dp(6),dp(6));
            nt.setMaxLines(2);
            nt.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                    new int[]{Color.TRANSPARENT,Color.argb(235,0,0,0)}));
            card.addView(nt,new FrameLayout.LayoutParams(dp(isTv()?180:105),dp(isTv()?40:58),Gravity.BOTTOM));
            card.setOnClickListener(v->details(m.optString("type","movie"),m));
            styleTvCard(card,im);
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(dp(isTv()?180:105),dp(isTv()?105:175));
            cp.setMargins(0,0,dp(10),0);
            row.addView(card,cp);
            loadImage(im,tileArtwork(m));
        }
        content.addView(grid);
        status.setText(found.size()+" result(s)");
    }
    void showHome(){ search.setText(""); load(); }


    void reportDiagnostic(String type,String detail){
        new Thread(()->{
            try{
                URL u=new URL(BASE+"/app/api/diagnostics");
                HttpURLConnection q=(HttpURLConnection)u.openConnection();
                q.setRequestMethod("POST"); q.setConnectTimeout(4000); q.setReadTimeout(5000);
                q.setDoOutput(true); q.setRequestProperty("Content-Type","application/json");
                String lic=prefs==null?"":prefs.getString("license_code","");
                q.setRequestProperty("X-Skyflix-License",lic); q.setRequestProperty("X-Skyflix-Device",deviceId());
                JSONObject body=new JSONObject(); body.put("type",type); body.put("detail",detail==null?"":detail); body.put("app","android"); body.put("version","1.0.24");
                byte[] bytes=body.toString().getBytes("UTF-8"); q.setFixedLengthStreamingMode(bytes.length);
                OutputStream out=q.getOutputStream(); out.write(bytes); out.close(); q.getResponseCode(); q.disconnect();
            }catch(Exception ignored){}
        }).start();
    }

    boolean looksLikePlayableUrl(String u){
        if(u==null||u.trim().length()==0)return false;
        try{
            Uri x=Uri.parse(u);
            String host=x.getHost();
            String path=x.getPath();
            String s=(u+" "+(path==null?"":path)).toLowerCase(Locale.UK);

            // Never send AIOStreams/debrid waiting or configuration pages to VLC.
            if(host!=null){
                host=host.toLowerCase(Locale.UK);
                if(host.contains("aiostreams.elfhosted.com") &&
                        (s.contains("/stremio/") || s.contains("configure") ||
                         s.contains("download") || s.contains("waiting"))) return false;
            }
            if(s.contains("still-downloading") || s.contains("still_downloading") ||
               s.contains("not-ready") || s.contains("not_ready")) return false;

            // Obvious web pages are not playable media.
            if(s.endsWith(".html") || s.endsWith(".htm") || s.contains("/configure?")) return false;
            return true;
        }catch(Exception e){ return false; }
    }

    boolean looksLikeWaitingStream(JSONObject s){
        if(s==null)return true;
        String meta=(s.optString("name","")+" "+s.optString("title","")+" "+
                s.optString("description","")+" "+s.optString("behaviorHints","")).toLowerCase(Locale.UK);
        return meta.contains("still downloading") || meta.contains("still_downloading") ||
               meta.contains("not ready") || meta.contains("not-ready") ||
               meta.contains("preparing") || meta.contains("waiting for");
    }

    // Do not preflight AIOStreams/debrid URLs from the Android app.
    // Signed media URLs commonly reject HEAD requests even when VLC can play them.
    JSONObject findPlayableStream(JSONArray a){
        if(a==null)return null;

        // Nuvio/Stremio-style priority: a real media URL is playable; an
        // externalUrl is only a browser destination unless it is clearly a
        // media asset. Prefer the server-preserved original URL when present.
        for(int i=0;i<a.length();i++){
            JSONObject s=a.optJSONObject(i);
            if(s==null||looksLikeWaitingStream(s))continue;

            // Always prefer Skyflix's licence-protected playback URL.
            // It carries the AIOStreams request headers and keeps playback
            // behind /app/api/proxy instead of bypassing the server path.
            String u=s.optString("url","");
            if(looksLikePlayableUrl(u))return s;

            // Fallback only when a source was not wrapped by Skyflix.
            String original=s.optString("skyflixOriginalUrl","");
            if(looksLikePlayableUrl(original))return s;
        }

        for(int i=0;i<a.length();i++){
            JSONObject s=a.optJSONObject(i);
            if(s==null||looksLikeWaitingStream(s))continue;
            String u=s.optString("externalUrl","");
            if(looksLikePlayableUrl(u) &&
               (u.toLowerCase(Locale.UK).contains(".m3u8") ||
                u.toLowerCase(Locale.UK).contains(".mp4") ||
                u.toLowerCase(Locale.UK).contains(".mpd"))){
                return s;
            }
        }
        return null;
    }

    void play(String type,String id,String name){
        status.setText("Finding source for "+name+"…");
        prefs.edit().putString("resume_id",id).putString("resume_name",name).putString("resume_type",type).apply();
        new Thread(()->{
            try{
                String endpoint=BASE+"/app/api/streams?type="+URLEncoder.encode(type,"UTF-8")+"&id="+URLEncoder.encode(id,"UTF-8");
                JSONObject stream=null;
                String lastMessage="No playable source returned";
                for(int attempt=0;attempt<7 && stream==null;attempt++){
                    try{
                        JSONObject data=new JSONObject(get(endpoint));
                        stream=findPlayableStream(data.optJSONArray("streams"));
                        if(stream==null) lastMessage="Waiting for the video to become ready…";
                    }catch(Exception ex){ lastMessage="Waiting for source…"; }
                    if(stream==null && attempt<6){
                        final String msg=lastMessage; runOnUiThread(()->status.setText(msg));
                        Thread.sleep(5000);
                    }
                }
                if(stream==null) throw new Exception(lastMessage);
                // The server-generated URL is the canonical playback path:
                // licence check -> proxy -> upstream stream -> Media3.
                String u=stream.optString("url","");
                if(!looksLikePlayableUrl(u))u=stream.optString("skyflixOriginalUrl","");
                if(!looksLikePlayableUrl(u))u=stream.optString("externalUrl","");
                if(!looksLikePlayableUrl(u))throw new Exception("No stream URL");

                final String streamUrl=u;
                final JSONObject selectedStream=stream;
                reportDiagnostic("playback_start","source_found:" + stream.optString("skyflixSource","Stremio"));
                runOnUiThread(()->startInternalPlayer(streamUrl,name,selectedStream));
            }catch(Exception e){
                runOnUiThread(()->{
                    status.setText("No playable source returned");
                    reportDiagnostic("playback_error",e.getMessage()==null?"source_not_found":e.getMessage());
                    Toast.makeText(this,e.getMessage()==null?"Video is not ready yet":e.getMessage(),Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    void startInternalPlayer(String streamUrl,String name,JSONObject stream){
        releaseInternalPlayer();
        playerView=new PlayerView(this);
        playerView.setUseController(true);
        playerView.setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING);
        playerView.setBackgroundColor(Color.BLACK);
        playerView.setFocusable(true);
        playerView.setKeepScreenOn(true);

        // Match Nuvio's HTTP source handling: honour addon proxyHeaders
        // instead of throwing them away before ExoPlayer starts.
        Map<String,String> headers=new HashMap<>();
        try{
            JSONObject h=stream==null?null:stream.optJSONObject("skyflixRequestHeaders");
            if(h==null && stream!=null){
                JSONObject bh=stream.optJSONObject("behaviorHints");
                JSONObject ph=bh==null?null:bh.optJSONObject("proxyHeaders");
                h=ph==null?null:ph.optJSONObject("request");
            }
            if(h!=null){
                Iterator<String> keys=h.keys();
                while(keys.hasNext()){
                    String k=keys.next();
                    String v=h.optString(k,"");
                    if(k.length()>0 && v.length()>0)headers.put(k,v);
                }
            }
        }catch(Exception ignored){}

        DefaultHttpDataSource.Factory http=new DefaultHttpDataSource.Factory()
                .setAllowCrossProtocolRedirects(true);
        if(!headers.isEmpty())http.setDefaultRequestProperties(headers);
        DefaultDataSource.Factory data=new DefaultDataSource.Factory(this,http);
        DefaultMediaSourceFactory mediaFactory=new DefaultMediaSourceFactory(this)
                .setDataSourceFactory(data);

        player=new ExoPlayer.Builder(this)
                .setMediaSourceFactory(mediaFactory)
                .build();
        playerView.setPlayer(player);
        root.addView(playerView,new LinearLayout.LayoutParams(-1,0,1));

        // AIOStreams/Nuvio sources sometimes use a URL with no .m3u8 suffix.
        // Let Media3 infer normal files, but explicitly mark obvious HLS/DASH.
        String low=streamUrl.toLowerCase(Locale.UK);
        MediaItem item;
        if(low.contains(".m3u8")){
            item=new MediaItem.Builder().setUri(Uri.parse(streamUrl))
                    .setMimeType(androidx.media3.common.MimeTypes.APPLICATION_M3U8).build();
        }else if(low.contains(".mpd")){
            item=new MediaItem.Builder().setUri(Uri.parse(streamUrl))
                    .setMimeType(androidx.media3.common.MimeTypes.APPLICATION_MPD).build();
        }else{
            item=MediaItem.fromUri(Uri.parse(streamUrl));
        }

        player.setMediaItem(item);
        player.prepare();
        player.play();
        status.setText("Playing "+name);
        playerView.requestFocus();
    }

    void releaseInternalPlayer(){
        if(playerView!=null){ root.removeView(playerView); playerView=null; }
        if(player!=null){ player.release(); player=null; }
    }

    void loadImage(ImageView v,String url){ if(url==null||url.length()==0)return; new Thread(()->{try{
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection(); c.setConnectTimeout(8000); c.setReadTimeout(10000); c.connect();
        InputStream in=c.getInputStream(); Bitmap b=BitmapFactory.decodeStream(in); in.close(); if(b!=null)runOnUiThread(()->v.setImageBitmap(b));
    }catch(Exception ignored){}}).start(); }

    String get(String u)throws Exception{
        HttpURLConnection c=(HttpURLConnection)new URL(u).openConnection(); c.setConnectTimeout(10000); c.setReadTimeout(15000);
        String license=prefs==null?"":prefs.getString("license_code",""); if(license.length()>0)c.setRequestProperty("X-Skyflix-License",license); c.setRequestProperty("X-Skyflix-Device",deviceId());
        BufferedReader b=new BufferedReader(new InputStreamReader(c.getInputStream())); StringBuilder s=new StringBuilder(); String l;
        while((l=b.readLine())!=null)s.append(l); b.close(); return s.toString();
    }
    @Override protected void onDestroy(){
        releaseInternalPlayer();
        super.onDestroy();
    }
}
