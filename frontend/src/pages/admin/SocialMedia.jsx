import { useState, useEffect, useCallback } from "react";
import {
  FiSend, FiImage, FiLoader, FiEye, FiThumbsUp,
  FiMessageCircle, FiShare2, FiExternalLink, FiMousePointer,
  FiFacebook, FiTrendingUp, FiActivity, FiAlertCircle, FiX, FiCheckCircle, FiLogOut
} from "react-icons/fi";
import toast from "react-hot-toast";

/* =========================
   FACEBOOK APP CONFIG
   ========================= */
const FB_APP_ID = "1316444013881683";
const FB_API_VERSION = "v19.0";
const FB_SCOPES = "pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content";

const SESSION_KEY = "fb_session_v1";

/* =========================
   FACEBOOK SDK LOADER
   ========================= */
function loadFacebookSdk() {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: false,
        version: FB_API_VERSION,
      });
      resolve(window.FB);
    };

    if (document.getElementById("facebook-jssdk")) return;
    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.async = true;
    js.defer = true;
    document.body.appendChild(js);
  });
}

export default function SocialMedia() {
  /* ---- Auth state ---- */
  const [sdkReady, setSdkReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [fbUser, setFbUser] = useState(null); // {name, userAccessToken}
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [authError, setAuthError] = useState("");

  /* ---- New Post form states ---- */
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [media, setMedia] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");

  /* ---- Feed states ---- */
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState({});

  /* Load SDK + restore session on mount */
  useEffect(() => {
    loadFacebookSdk().then(() => setSdkReady(true));

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.userAccessToken && saved?.pages) {
          setFbUser({ name: saved.name, userAccessToken: saved.userAccessToken });
          setPages(saved.pages);
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const persistSession = (name, userAccessToken, pagesList) => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ name, userAccessToken, pages: pagesList })
    );
  };

  const fetchPagesForUser = (userAccessToken) => {
    return new Promise((resolve, reject) => {
      window.FB.api("/me/accounts", { access_token: userAccessToken, fields: "id,name,category,access_token,tasks" }, (res) => {
        if (!res || res.error) {
          reject(res?.error || new Error("Failed to fetch pages"));
          return;
        }
        resolve(res.data || []);
      });
    });
  };

  const handleLogin = () => {
    if (!sdkReady || !window.FB) {
      toast.error("Facebook SDK is still loading, try again in a second");
      return;
    }
    setAuthLoading(true);
    setAuthError("");

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const userAccessToken = response.authResponse.accessToken;

          window.FB.api("/me", { access_token: userAccessToken, fields: "name" }, async (meRes) => {
            const name = meRes?.name || "Facebook user";
            try {
              const pagesList = await fetchPagesForUser(userAccessToken);
              setFbUser({ name, userAccessToken });
              setPages(pagesList);
              persistSession(name, userAccessToken, pagesList);
              toast.success(`Logged in as ${name}`);
            } catch (err) {
              console.error(err);
              setAuthError(err?.message || "Could not load your pages");
              toast.error("Logged in, but failed to load your pages");
            } finally {
              setAuthLoading(false);
            }
          });
        } else {
          setAuthLoading(false);
          setAuthError("Login was cancelled or not fully authorized");
        }
      },
      { scope: FB_SCOPES }
    );
  };

  const handleLogout = () => {
    if (window.FB) {
      window.FB.logout();
    }
    sessionStorage.removeItem(SESSION_KEY);
    setFbUser(null);
    setPages([]);
    setSelectedPage(null);
    setPosts([]);
    toast.success("Logged out");
  };

  /* ---- Fetch Page Feed ---- */
  useEffect(() => {
    if (!selectedPage) {
      setPosts([]);
      return;
    }

    const fetchPageFeed = async () => {
      setLoadingPosts(true);
      try {
        const fields = "id,message,created_time,full_picture,permalink_url,shares,likes.summary(true).limit(0),comments.summary(true).limit(0),insights.metric(post_impressions,post_clicks){values}";
        const url = `https://graph.facebook.com/${FB_API_VERSION}/${selectedPage.id}/feed?fields=${fields}&limit=7&access_token=${selectedPage.access_token}`;

        let response = await fetch(url);
        let data = await response.json();

        if (data.error && data.error.message?.includes("insights")) {
          const simpleFields = "id,message,created_time,full_picture,permalink_url,shares,likes.summary(true).limit(0),comments.summary(true).limit(0)";
          const simpleUrl = `https://graph.facebook.com/${FB_API_VERSION}/${selectedPage.id}/feed?fields=${simpleFields}&limit=7&access_token=${selectedPage.access_token}`;
          response = await fetch(simpleUrl);
          data = await response.json();
        }

        if (data.error) {
          toast.error(data.error.message || "Could not load posts");
          setPosts([]);
        } else if (data.data) {
          const parsed = data.data.map((p) => {
            const likesCount = p.likes?.summary?.total_count || 0;
            const commentsCount = p.comments?.summary?.total_count || 0;
            const sharesCount = p.shares?.count || 0;

            let viewsCount = 0;
            let clicksCount = 0;

            if (p.insights?.data) {
              const impressionsData = p.insights.data.find((ins) => ins.name === "post_impressions");
              if (impressionsData?.values?.length > 0) viewsCount = impressionsData.values[0].value;
              const clicksData = p.insights.data.find((ins) => ins.name === "post_clicks");
              if (clicksData?.values?.length > 0) clicksCount = clicksData.values[0].value;
            }

            return {
              id: p.id,
              message: p.message || "",
              createdTime: p.created_time,
              picture: p.full_picture || "",
              permalinkUrl: p.permalink_url,
              likes: likesCount,
              comments: commentsCount,
              shares: sharesCount,
              views: viewsCount,
              clicks: clicksCount,
            };
          });
          setPosts(parsed);
        }
      } catch (err) {
        console.error("Fetch page feed failed", err);
        toast.error("Network error loading feed");
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPageFeed();
  }, [selectedPage]);

  const handleMedia = (e) => {
    const file = e.target.files[0];
    setMedia(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const reloadFeed = useCallback(() => {
    setSelectedPage((prev) => (prev ? { ...prev } : prev));
  }, []);

  const postToFacebook = async () => {
    if (!selectedPage) {
      toast.error("Please select a Facebook page first");
      return;
    }
    if (!title && !text && !media) {
      toast.error("Please write something or add media to publish");
      return;
    }

    setLoading(true);
    setStatus("");
    setStatusType("");

    try {
      const fullMessage = title ? `${title}\n\n${text}` : text;
      const token = selectedPage.access_token;

      let endpoint = "";
      let body;

      if (media && media.type.startsWith("image/")) {
        endpoint = `https://graph.facebook.com/${FB_API_VERSION}/${selectedPage.id}/photos`;
        body = new FormData();
        body.append("source", media);
        body.append("caption", fullMessage);
        body.append("access_token", token);
      } else if (media && media.type.startsWith("video/")) {
        endpoint = `https://graph.facebook.com/${FB_API_VERSION}/${selectedPage.id}/videos`;
        body = new FormData();
        body.append("source", media);
        body.append("description", fullMessage);
        body.append("access_token", token);
      } else {
        endpoint = `https://graph.facebook.com/${FB_API_VERSION}/${selectedPage.id}/feed`;
        body = new URLSearchParams();
        body.append("message", fullMessage);
        body.append("access_token", token);
      }

      const res = await fetch(endpoint, { method: "POST", body });
      const data = await res.json();

      if (data?.id) {
        setStatus("Post published successfully");
        setStatusType("success");
        toast.success("Post published successfully");

        setTitle("");
        setText("");
        setMedia(null);
        setPreview("");
        reloadFeed();
      } else {
        setStatus(data?.error?.message || "Failed to post");
        setStatusType("error");
        toast.error(data?.error?.message || "Publishing failed");
      }
    } catch (err) {
      console.error(err);
      setStatus("Network error connecting to Facebook");
      setStatusType("error");
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const getPageInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : "FB");

  const getAggregatedStats = () => {
    if (posts.length === 0) return { likes: 0, views: 0, comments: 0, shares: 0 };
    return posts.reduce(
      (acc, p) => ({
        likes: acc.likes + (p.likes || 0),
        views: acc.views + (p.views || 0),
        comments: acc.comments + (p.comments || 0),
        shares: acc.shares + (p.shares || 0),
      }),
      { likes: 0, views: 0, comments: 0, shares: 0 }
    );
  };

  const totalStats = getAggregatedStats();

  /* =========================
     NOT LOGGED IN VIEW
     ========================= */
  if (!fbUser) {
    return (
      <div className="min-h-[480px] flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="p-4 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl text-3xl">
          <FiFacebook />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white">Connect your Facebook pages</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            Log in with Facebook to load the pages you manage and publish posts directly from here.
          </p>
        </div>

        {authError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 max-w-sm">
            <FiAlertCircle /> {authError}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={!sdkReady || authLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3.5 px-8 rounded-2xl flex items-center gap-2.5 hover:opacity-90 disabled:opacity-40 transition-all text-sm"
        >
          {authLoading ? <FiLoader className="animate-spin" /> : <FiFacebook />}
          {authLoading ? "Connecting..." : "Continue with Facebook"}
        </button>

        {!sdkReady && (
          <p className="text-[11px] text-slate-600">Loading Facebook SDK...</p>
        )}
      </div>
    );
  }

  /* =========================
     LOGGED IN VIEW
     ========================= */
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 font-body">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <span className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <FiFacebook className="text-2xl" />
            </span>
            Social Media Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Signed in as <span className="text-slate-300 font-medium">{fbUser.name}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-2 border border-white/10 rounded-xl px-4 py-2.5 hover:border-white/20 transition-all"
        >
          <FiLogOut /> Log out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Select page and content</h3>
              <p className="text-xs text-slate-500">Choose the destination page and build your post.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#16a34a]">Facebook page</label>
              {pages.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4">
                  No pages found on this account. Make sure your Facebook user manages at least one page.
                </div>
              ) : (
                <select
                  className="w-full bg-slate-950/60 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#16a34a] transition-all text-white"
                  onChange={(e) => setSelectedPage(pages.find((p) => p.id === e.target.value))}
                  value={selectedPage?.id || ""}
                >
                  <option value="">Choose a page...</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedPage && (
              <div className="flex items-center gap-3 bg-[#16a34a]/10 border border-[#16a34a]/20 rounded-2xl p-4 animate-in fade-in duration-300">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16a34a] to-[#166534] text-black font-bold flex items-center justify-center">
                  {getPageInitials(selectedPage.name)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Posting as</h4>
                  <p className="text-sm text-[#16a34a] font-medium">{selectedPage.name}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Post title</label>
                <input
                  className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:border-[#16a34a] transition-all text-white disabled:opacity-50 placeholder-slate-600"
                  placeholder="Catchy title (optional)..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!selectedPage}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Message body</label>
                <textarea
                  className="w-full h-36 bg-slate-950/40 border border-white/10 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:border-[#16a34a] transition-all text-white disabled:opacity-50 placeholder-slate-600 resize-none"
                  placeholder="What would you like to share today?"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={!selectedPage}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Attachments</label>
                <div
                  className={`border border-dashed rounded-2xl p-5 text-center transition-all bg-slate-950/20 ${
                    !selectedPage
                      ? "border-white/5 opacity-50 cursor-not-allowed"
                      : "border-white/10 hover:border-[#16a34a]/40 hover:bg-white/[0.01] cursor-pointer"
                  }`}
                  onClick={() => selectedPage && document.getElementById("post-media-input").click()}
                >
                  <input
                    type="file"
                    id="post-media-input"
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleMedia}
                    disabled={!selectedPage}
                  />
                  {preview ? (
                    <div className="relative group rounded-xl overflow-hidden max-h-[140px]">
                      <img src={preview} alt="Upload preview" className="w-full object-cover max-h-[140px]" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMedia(null);
                          setPreview("");
                        }}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full transition-all"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 py-2">
                      <FiImage className="text-2xl text-slate-600" />
                      <p className="text-[11px] font-medium">Click to upload photo / video</p>
                      <p className="text-[9px] text-slate-600">Supports JPG, PNG, MP4 up to 50MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              className="w-full bg-gradient-to-r from-[#16a34a] to-[#166534] text-black font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-[#16a34a]/10 text-xs uppercase tracking-wider"
              onClick={postToFacebook}
              disabled={loading || !selectedPage}
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin text-sm" /> Publishing...
                </>
              ) : (
                <>
                  <FiSend className="text-sm" /> Publish to Facebook
                </>
              )}
            </button>

            {status && (
              <div
                className={`p-4 rounded-2xl flex items-start gap-2.5 text-xs ${
                  statusType === "success"
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}
              >
                {statusType === "success" ? <FiCheckCircle className="text-sm mt-0.5" /> : <FiAlertCircle className="text-sm mt-0.5" />}
                <span>{status}</span>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {!selectedPage ? (
            <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[480px]">
              <div className="p-4 bg-slate-950 border border-white/5 rounded-2xl text-slate-500 text-3xl mb-4">
                <FiActivity />
              </div>
              <h3 className="text-lg font-bold text-white">Select a Facebook page</h3>
              <p className="text-slate-500 text-xs max-w-sm mt-1.5 leading-relaxed">
                Choose one of your connected Facebook pages from the dropdown on the left to fetch recent analytics and posts.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FiTrendingUp className="text-[#16a34a]" /> Performance analytics
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Calculated across the latest {posts.length} posts</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <FiEye size={12} className="text-blue-400" /> Impressions
                    </span>
                    <span className="text-xl font-bold text-white">{totalStats.views.toLocaleString()}</span>
                  </div>
                  <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <FiThumbsUp size={11} className="text-red-400" /> Likes
                    </span>
                    <span className="text-xl font-bold text-white">{totalStats.likes.toLocaleString()}</span>
                  </div>
                  <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <FiMessageCircle size={12} className="text-emerald-400" /> Comments
                    </span>
                    <span className="text-xl font-bold text-white">{totalStats.comments.toLocaleString()}</span>
                  </div>
                  <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex flex-col gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                      <FiMousePointer size={11} className="text-yellow-400" /> Link clicks
                    </span>
                    <span className="text-xl font-bold text-white">{totalStats.shares.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">Latest page feed</h3>

                {loadingPosts ? (
                  <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-12 text-center">
                    <FiLoader className="animate-spin text-3xl text-[#16a34a] mx-auto mb-3" />
                    <p className="text-slate-400 text-xs">Querying Facebook feed...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-slate-900/20 border border-white/5 rounded-3xl p-12 text-center text-slate-500 text-xs italic">
                    No posts found on this page.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {posts.map((post) => {
                      const isExpanded = expandedPosts[post.id];
                      const mustTruncate = post.message.length > 180;
                      const displayedText = mustTruncate && !isExpanded ? post.message.slice(0, 180) + "..." : post.message;

                      return (
                        <div
                          key={post.id}
                          className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl space-y-4 hover:border-slate-800/80 hover:bg-slate-900/50 transition-all duration-300 shadow-md group"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16a34a] to-[#166534] text-black font-bold flex items-center justify-center uppercase select-none">
                                {getPageInitials(selectedPage.name)}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white">{selectedPage.name}</h4>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(post.createdTime).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>

                            <a
                              href={post.permalinkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:border-white/10 bg-slate-950/40 transition-all flex items-center justify-center"
                              title="Open on Facebook"
                            >
                              <FiExternalLink size={14} />
                            </a>
                          </div>

                          {post.message && (
                            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {displayedText}
                              {mustTruncate && (
                                <button
                                  onClick={() => setExpandedPosts((prev) => ({ ...prev, [post.id]: !isExpanded }))}
                                  className="text-[#16a34a] font-bold ml-1.5 focus:outline-none hover:underline inline"
                                >
                                  {isExpanded ? "Read less" : "Read more"}
                                </button>
                              )}
                            </div>
                          )}

                          {post.picture && (
                            <div className="rounded-2xl border border-white/5 overflow-hidden max-h-[300px] w-full bg-black/20 flex items-center justify-center">
                              <img
                                src={post.picture}
                                alt="Post attachment"
                                className="w-full object-cover max-h-[300px] group-hover:scale-[1.01] transition-transform duration-500 cursor-pointer"
                                onClick={() => window.open(post.picture, "_blank")}
                              />
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-slate-500" title="Post impressions">
                                <FiEye className="text-sm text-blue-500/80" />
                                <span className="text-[11px] font-semibold text-slate-400">{post.views.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500" title="Link clicks">
                                <FiMousePointer className="text-sm text-yellow-500/80" />
                                <span className="text-[11px] font-semibold text-slate-400">{post.clicks.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-slate-500" title="Likes">
                                <FiThumbsUp className="text-xs text-red-500/80" />
                                <span className="text-[11px] font-semibold text-slate-400">{post.likes.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500" title="Comments">
                                <FiMessageCircle className="text-sm text-emerald-500/80" />
                                <span className="text-[11px] font-semibold text-slate-400">{post.comments.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500" title="Shares">
                                <FiShare2 className="text-xs text-indigo-500/80" />
                                <span className="text-[11px] font-semibold text-slate-400">{post.shares.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
