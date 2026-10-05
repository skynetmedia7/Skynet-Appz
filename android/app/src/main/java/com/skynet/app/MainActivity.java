    void play(String type,String id,String name){
        status.setText("Finding source…");
        prefs.edit().putString("resume_id",id).putString("resume_name",name).putString("resume_type",type).apply();

        new Thread(()->{
            try{
                String endpoint=BASE+"/app/api/streams?type="+URLEncoder.encode(type,"UTF-8")+"&id="+URLEncoder.encode(id,"UTF-8");
                JSONObject stream=null;

                // Keep Fire TV responsive: make only two short source checks.
                // Do not sit on a waiting/debrid page for 30+ seconds.
                for(int attempt=0;attempt<2 && stream==null;attempt++){
                    JSONObject data=new JSONObject(get(endpoint));
                    JSONArray a=data.optJSONArray("streams");
                    stream=findPlayableStream(a);
                    if(stream==null && attempt==0){
                        runOnUiThread(()->status.setText("Preparing video…"));
                        Thread.sleep(3000);
                    }
                }

                if(stream==null)throw new Exception("No ready playable source");
                String u=stream.optString("url","");
                if(u.length()==0)u=stream.optString("externalUrl","");
                if(!looksLikePlayableUrl(u))throw new Exception("Invalid stream URL");

                final String streamUrl=u;
                runOnUiThread(()->{
                    try{
                        // Let Fire TV use the installed video player automatically.
                        Intent player=new Intent(Intent.ACTION_VIEW);
                        player.setDataAndType(Uri.parse(streamUrl),"video/*");
                        player.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(player);
                        status.setText("Playing "+name);
                    }catch(Exception ex){
                        status.setText("No video player available");
                        Toast.makeText(this,"Install a video player such as VLC, then try again.",Toast.LENGTH_LONG).show();
                    }
                });
            }catch(Exception e){
                runOnUiThread(()->{
                    status.setText("Video source not ready");
                    Toast.makeText(this,"The video source isn't ready yet. Try PLAY again.",Toast.LENGTH_LONG).show();
                });
            }
        }).start();
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
