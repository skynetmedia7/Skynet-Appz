package com.skynet.app;
import android.app.*;import android.os.*;import android.content.*;import android.net.Uri;import android.graphics.Color;import android.view.*;import android.widget.*;import java.io.*;import java.net.*;import org.json.*;

public class MainActivity extends Activity{
 static final String BASE="http://158.220.86.53:10000"; LinearLayout rows; TextView status;
 TextView t(String s,int z){TextView v=new TextView(this);v.setText(s);v.setTextColor(Color.WHITE);v.setTextSize(z);v.setPadding(20,12,20,12);return v;}
 public void onCreate(Bundle b){super.onCreate(b); LinearLayout r=new LinearLayout(this);r.setOrientation(LinearLayout.VERTICAL);r.setBackgroundColor(Color.rgb(5,5,5));
 TextView h=t("SKYNET",30);h.setTextColor(Color.rgb(242,201,76));h.setTypeface(null,1);r.addView(h,new LinearLayout.LayoutParams(-1,70));
 ScrollView s=new ScrollView(this);rows=new LinearLayout(this);rows.setOrientation(LinearLayout.VERTICAL);s.addView(rows);r.addView(s,new LinearLayout.LayoutParams(-1,0,1));
 status=t("Connecting to Skynet VPS…",14);r.addView(status,new LinearLayout.LayoutParams(-1,55));setContentView(r);load();}
 void load(){new Thread(()->{try{JSONObject m=new JSONObject(get(BASE+"/manifest.json"));runOnUiThread(()->status.setText("SKYNET • Movies • Series"));
 JSONArray c=m.optJSONArray("catalogs");for(int i=0;i<Math.min(6,c==null?0:c.length());i++){JSONObject x=c.getJSONObject(i);row(x.optString("type","movie"),x.optString("id"),x.optString("name","Skynet"));}}
 catch(Exception e){runOnUiThread(()->status.setText("Connection error: "+e.getMessage()));}}).start();}
 void row(String type,String id,String name){new Thread(()->{try{JSONArray a=new JSONObject(get(BASE+"/catalog/"+type+"/"+URLEncoder.encode(id,"UTF-8")+".json")).optJSONArray("metas");if(a==null)return;
 LinearLayout line=new LinearLayout(this);line.setOrientation(LinearLayout.HORIZONTAL);TextView title=t(name,20);title.setTypeface(null,1);
 runOnUiThread(()->{rows.addView(title);rows.addView(line);});
 for(int i=0;i<Math.min(12,a.length());i++){JSONObject q=a.getJSONObject(i);String n=q.optString("name"),mid=q.optString("id");Button b=new Button(this);b.setText(n);b.setTextColor(Color.WHITE);b.setAllCaps(false);b.setOnClickListener(v->play(type,mid,n));runOnUiThread(()->line.addView(b,new LinearLayout.LayoutParams(230,120)));}}
 catch(Exception ignored){}}).start();}
 String get(String u)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL(u).openConnection();c.setConnectTimeout(10000);c.setReadTimeout(15000);BufferedReader b=new BufferedReader(new InputStreamReader(c.getInputStream()));StringBuilder s=new StringBuilder();String l;while((l=b.readLine())!=null)s.append(l);return s.toString();}
 void play(String type,String id,String name){status.setText("Finding source for "+name+"…");new Thread(()->{try{JSONArray a=new JSONObject(get(BASE+"/stream/"+type+"/"+URLEncoder.encode(id,"UTF-8")+".json")).optJSONArray("streams");if(a==null||a.length()==0)throw new Exception("No source");String u=a.getJSONObject(0).optString("url");runOnUiThread(()->startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(u))));}catch(Exception e){runOnUiThread(()->status.setText("No playable source returned"));}}).start();}
}