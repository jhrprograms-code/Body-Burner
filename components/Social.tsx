"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Check,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Share2,
  Shield,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { StoreProps } from "./BodyBurner";
import { Empty, ErrorNote, Heading, Section } from "./ui";

type View = "Feed" | "Friends" | "Chats" | "Groups";
type Profile = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
};
type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
};
type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};
type Group = {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  created_at: string;
};
type Post = {
  id: string;
  author_id: string;
  group_id: string | null;
  shared_post_id: string | null;
  body: string;
  created_at: string;
};
type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
};
type Reaction = {
  post_id: string;
  user_id: string;
  kind: "like" | "love" | "strong" | "support";
};

const friendlyTime = (value: string) =>
  new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function Social({
  user,
  onLogin,
  state,
  notify,
}: Pick<StoreProps, "state" | "notify"> & {
  user: User | null;
  onLogin: () => void;
}) {
  const [view, setView] = useState<View>("Feed");
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const selectedFriendRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [postBody, setPostBody] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fail = (value: unknown) =>
    setError(value instanceof Error ? value.message : "Something went wrong.");

  const friendIds = useMemo(() => {
    if (!user) return [];
    return friendships
      .filter((f) => f.status === "accepted")
      .map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id,
      );
  }, [friendships, user]);

  const incoming = useMemo(
    () =>
      user
        ? friendships.filter(
            (f) => f.status === "pending" && f.addressee_id === user.id,
          )
        : [],
    [friendships, user],
  );

  const loadProfiles = useCallback(async (ids: string[]) => {
    if (!supabase || !ids.length) return;
    const unique = [...new Set(ids)];
    const { data, error } = await supabase
      .from("social_profiles")
      .select("user_id,username,display_name,bio")
      .in("user_id", unique);
    if (error) throw error;
    setProfiles((current) => ({
      ...current,
      ...Object.fromEntries((data || []).map((p) => [p.user_id, p])),
    }));
  }, []);

  const loadCommunity = useCallback(async () => {
    if (!supabase || !user) return;
    setError("");
    const displayName =
      state.profile.name.trim() || user.email?.split("@")[0] || "Member";
    const { error: profileError } = await supabase
      .from("social_profiles")
      .upsert(
        {
          user_id: user.id,
          username: `member-${user.id.slice(0, 8)}`,
          display_name: displayName.slice(0, 60),
        },
        { onConflict: "user_id" },
      );
    if (profileError) throw profileError;

    const [friendResult, groupResult, postResult] = await Promise.all([
      supabase
        .from("friendships")
        .select("id,requester_id,addressee_id,status")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),
      supabase
        .from("social_groups")
        .select("id,owner_id,name,description,created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("social_posts")
        .select("id,author_id,group_id,shared_post_id,body,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (friendResult.error) throw friendResult.error;
    if (groupResult.error) throw groupResult.error;
    if (postResult.error) throw postResult.error;
    const nextFriendships = (friendResult.data || []) as Friendship[];
    const nextPosts = (postResult.data || []) as Post[];
    setFriendships(nextFriendships);
    setGroups((groupResult.data || []) as Group[]);
    setPosts(nextPosts);

    const postIds = nextPosts.map((p) => p.id);
    const relatedUsers = [
      user.id,
      ...nextFriendships.flatMap((f) => [f.requester_id, f.addressee_id]),
      ...nextPosts.map((p) => p.author_id),
    ];
    await loadProfiles(relatedUsers);
    if (!postIds.length) {
      setComments([]);
      setReactions([]);
      return;
    }
    const [commentResult, reactionResult] = await Promise.all([
      supabase
        .from("social_comments")
        .select("id,post_id,author_id,body,created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("social_reactions")
        .select("post_id,user_id,kind")
        .in("post_id", postIds),
    ]);
    if (commentResult.error) throw commentResult.error;
    if (reactionResult.error) throw reactionResult.error;
    const nextComments = (commentResult.data || []) as Comment[];
    setComments(nextComments);
    setReactions((reactionResult.data || []) as Reaction[]);
    await loadProfiles(nextComments.map((c) => c.author_id));
  }, [loadProfiles, state.profile.name, user]);

  useEffect(() => {
    loadCommunity().catch(fail);
  }, [loadCommunity]);

  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  const loadMessages = useCallback(
    async (friendId: string) => {
      if (!supabase || !user) return;
      const { data, error } = await supabase
        .from("social_messages")
        .select("id,sender_id,recipient_id,body,created_at")
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) {
        setError(error.message || "Unable to load this conversation.");
        return;
      }
      setMessages((data || []) as Message[]);
    },
    [user],
  );

  useEffect(() => {
    if (!supabase || !user) return;
    const client = supabase;
    let active = true;
    let channel: ReturnType<typeof client.channel> | null = null;
    const connect = async () => {
      let { data, error } = await client
        .from("social_inbox_tokens")
        .select("token")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data && !error) {
        const created = await client
          .from("social_inbox_tokens")
          .insert({ user_id: user.id })
          .select("token")
          .single();
        data = created.data;
        error = created.error;
      }
      if (!active) return;
      if (error || !data) {
        setError("Live messages are reconnecting. New messages will still sync.");
        return;
      }
      channel = client
        .channel(`social:inbox:${data.token}`)
        .on("broadcast", { event: "INSERT" }, ({ payload }) => {
          const message = (payload as { new?: Message }).new;
          if (!message) return;
          if (message.sender_id === selectedFriendRef.current)
            setMessages((current) =>
              current.some((item) => item.id === message.id)
                ? current
                : [...current, message],
            );
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED" && selectedFriendRef.current)
            loadMessages(selectedFriendRef.current);
        });
    };
    connect();
    return () => {
      active = false;
      if (channel) client.removeChannel(channel);
    };
  }, [loadMessages, user]);

  useEffect(() => {
    if (!selectedFriend || view !== "Chats") return;
    const syncVisibleChat = () => {
      if (document.visibilityState === "visible") loadMessages(selectedFriend);
    };
    syncVisibleChat();
    const timer = window.setInterval(syncVisibleChat, 4000);
    document.addEventListener("visibilitychange", syncVisibleChat);
    window.addEventListener("focus", syncVisibleChat);
    window.addEventListener("pageshow", syncVisibleChat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", syncVisibleChat);
      window.removeEventListener("focus", syncVisibleChat);
      window.removeEventListener("pageshow", syncVisibleChat);
    };
  }, [loadMessages, selectedFriend, view]);

  const openChat = async (friendId: string) => {
    setSelectedFriend(friendId);
    setView("Chats");
    await loadMessages(friendId);
  };

  const findPeople = async () => {
    if (!supabase || !user || search.trim().length < 2) return;
    setBusy(true);
    setError("");
    const term = search.trim().replace(/[^\p{L}\p{N} ._-]/gu, "");
    if (term.length < 2) {
      setBusy(false);
      return;
    }
    const { data, error } = await supabase
      .from("social_profiles")
      .select("user_id,username,display_name,bio")
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .neq("user_id", user.id)
      .limit(20);
    setBusy(false);
    if (error) return fail(error);
    setSearchResults((data || []) as Profile[]);
  };

  const sendFriendRequest = async (person: Profile) => {
    if (!supabase || !user) return;
    setBusy(true);
    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: person.user_id,
    });
    setBusy(false);
    if (error) return fail(error);
    notify(`Friend request sent to ${person.display_name}.`);
    await loadCommunity().catch(fail);
  };

  const answerRequest = async (friendship: Friendship, accept: boolean) => {
    if (!supabase) return;
    const query = supabase.from("friendships");
    const { error } = accept
      ? await query
          .update({ status: "accepted", updated_at: new Date().toISOString() })
          .eq("id", friendship.id)
      : await query.delete().eq("id", friendship.id);
    if (error) return fail(error);
    notify(accept ? "Friend request accepted." : "Friend request declined.");
    await loadCommunity().catch(fail);
  };

  const sendMessage = async () => {
    if (!supabase || !user || !selectedFriend || !messageBody.trim()) return;
    const body = messageBody.trim();
    setMessageBody("");
    const { data, error } = await supabase
      .from("social_messages")
      .insert({ sender_id: user.id, recipient_id: selectedFriend, body })
      .select("id,sender_id,recipient_id,body,created_at")
      .single();
    if (error) return fail(error);
    setMessages((current) => [...current, data as Message]);
  };

  const createPost = async () => {
    if (!supabase || !user || !postBody.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("social_posts").insert({
      author_id: user.id,
      group_id: selectedGroup,
      body: postBody.trim(),
    });
    setBusy(false);
    if (error) return fail(error);
    setPostBody("");
    notify(
      selectedGroup ? "Posted to the group." : "Shared with your friends.",
    );
    await loadCommunity().catch(fail);
  };

  const react = async (postId: string, kind: Reaction["kind"] = "like") => {
    if (!supabase || !user) return;
    const mine = reactions.find(
      (r) => r.post_id === postId && r.user_id === user.id,
    );
    const { error } = mine
      ? mine.kind === kind
        ? await supabase
            .from("social_reactions")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id)
        : await supabase
            .from("social_reactions")
            .update({ kind })
            .eq("post_id", postId)
            .eq("user_id", user.id)
      : await supabase
          .from("social_reactions")
          .insert({ post_id: postId, user_id: user.id, kind });
    if (error) return fail(error);
    await loadCommunity().catch(fail);
  };

  const addComment = async (postId: string) => {
    if (!supabase || !user || !commentDrafts[postId]?.trim()) return;
    const { error } = await supabase.from("social_comments").insert({
      post_id: postId,
      author_id: user.id,
      body: commentDrafts[postId].trim(),
    });
    if (error) return fail(error);
    setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    await loadCommunity().catch(fail);
  };

  const sharePost = async (postId: string) => {
    if (!supabase || !user) return;
    const { error } = await supabase.from("social_posts").insert({
      author_id: user.id,
      shared_post_id: postId,
      body: "",
    });
    if (error) return fail(error);
    notify("Post shared with your friends.");
    await loadCommunity().catch(fail);
  };

  const createGroup = async () => {
    if (!supabase || !user || groupName.trim().length < 2) return;
    setBusy(true);
    const { error } = await supabase.from("social_groups").insert({
      owner_id: user.id,
      name: groupName.trim(),
      description: groupDescription.trim(),
    });
    setBusy(false);
    if (error) return fail(error);
    setGroupName("");
    setGroupDescription("");
    notify("Private group created.");
    await loadCommunity().catch(fail);
  };

  const addGroupMember = async (groupId: string, friendId: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("social_group_members")
      .insert({ group_id: groupId, user_id: friendId });
    if (error) return fail(error);
    notify("Friend added to the group.");
  };

  const reportPost = async (postId: string) => {
    if (!supabase || !user) return;
    const { error } = await supabase.from("social_reports").insert({
      reporter_id: user.id,
      post_id: postId,
      reason: "other",
      details: "Reported from the in-app feed.",
    });
    if (error) return fail(error);
    notify("Report received. Thank you.");
  };

  if (!user)
    return (
      <>
        <Heading
          eyebrow="YOUR COMMUNITY"
          title="Stronger together."
          text="Sign in to find friends, share progress and join private groups."
        />
        <Section
          title="Your social space stays private"
          className="social-signin"
        >
          <Shield size={30} />
          <p>
            Your health logs and progress photos are never posted automatically.
            You choose what to share.
          </p>
          <button className="primary" onClick={onLogin}>
            Sign in to continue
          </button>
        </Section>
      </>
    );

  const visiblePosts = selectedGroup
    ? posts.filter((post) => post.group_id === selectedGroup)
    : posts.filter((post) => post.group_id === null);
  const selectedPerson = selectedFriend ? profiles[selectedFriend] : null;

  return (
    <>
      <Heading
        eyebrow="YOUR COMMUNITY"
        title="Friends make consistency easier."
        text="Connect, encourage each other and share only what you choose."
      />
      <div
        className="social-tabs"
        role="tablist"
        aria-label="Community sections"
      >
        {(["Feed", "Friends", "Chats", "Groups"] as View[]).map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={view === item}
            className={view === item ? "active" : ""}
            onClick={() => setView(item)}
          >
            {item}
            {item === "Friends" && incoming.length > 0 && (
              <span className="social-count">{incoming.length}</span>
            )}
          </button>
        ))}
      </div>
      {error && <ErrorNote message={error} />}

      {view === "Feed" && (
        <div className="social-layout">
          <div>
            <Section
              title={
                selectedGroup
                  ? `Post in ${groups.find((g) => g.id === selectedGroup)?.name || "group"}`
                  : "Share with friends"
              }
              className="post-composer"
            >
              <label className="sr-only" htmlFor="social-post">
                Write a post
              </label>
              <textarea
                id="social-post"
                value={postBody}
                maxLength={5000}
                placeholder="Share an update, a win or some encouragement…"
                onChange={(event) => setPostBody(event.target.value)}
              />
              <div className="row between">
                <small>{postBody.length} / 5,000</small>
                <button
                  className="primary"
                  disabled={busy || !postBody.trim()}
                  onClick={createPost}
                >
                  <Send size={16} /> Post
                </button>
              </div>
            </Section>
            <PostList
              posts={visiblePosts}
              profiles={profiles}
              comments={comments}
              reactions={reactions}
              userId={user.id}
              drafts={commentDrafts}
              setDrafts={setCommentDrafts}
              react={react}
              addComment={addComment}
              share={sharePost}
              report={reportPost}
            />
          </div>
          <Section title="Friends-only feed" className="social-privacy-note">
            <Shield size={22} />
            <p>
              Nothing from Nutrition, Progress or your photo journal is shared
              automatically.
            </p>
          </Section>
        </div>
      )}

      {view === "Friends" && (
        <div className="social-columns">
          <Section title="Find people">
            <div className="social-search">
              <Search size={18} />
              <input
                value={search}
                placeholder="Search name or username"
                aria-label="Search people"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && findPeople()}
              />
              <button
                className="secondary"
                disabled={busy}
                onClick={findPeople}
              >
                Search
              </button>
            </div>
            <PeopleList
              people={searchResults}
              friendships={friendships}
              userId={user.id}
              action={(person) => (
                <button
                  className="secondary"
                  disabled={
                    busy ||
                    friendships.some(
                      (f) =>
                        f.requester_id === person.user_id ||
                        f.addressee_id === person.user_id,
                    )
                  }
                  onClick={() => sendFriendRequest(person)}
                >
                  <UserPlus size={16} /> Add
                </button>
              )}
            />
          </Section>
          <Section title="Requests">
            {!incoming.length ? (
              <Empty
                headline="No pending requests"
                text="New requests will appear here."
              />
            ) : (
              incoming.map((request) => {
                const person = profiles[request.requester_id];
                return (
                  <div className="person-row" key={request.id}>
                    <Avatar person={person} />
                    <PersonName person={person} />
                    <button
                      className="icon-btn"
                      aria-label={`Accept ${person?.display_name || "request"}`}
                      onClick={() => answerRequest(request, true)}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`Decline ${person?.display_name || "request"}`}
                      onClick={() => answerRequest(request, false)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                );
              })
            )}
          </Section>
          <Section title="Your friends" className="social-span">
            {!friendIds.length ? (
              <Empty
                headline="Your circle starts here"
                text="Search for a friend and send a request."
              />
            ) : (
              friendIds.map((id) => (
                <div className="person-row" key={id}>
                  <Avatar person={profiles[id]} />
                  <PersonName person={profiles[id]} />
                  <button className="secondary" onClick={() => openChat(id)}>
                    <MessageCircle size={16} /> Message
                  </button>
                </div>
              ))
            )}
          </Section>
        </div>
      )}

      {view === "Chats" && (
        <div className="chat-shell">
          <Section title="Messages" className="conversation-list">
            {!friendIds.length ? (
              <Empty
                headline="No conversations yet"
                text="Add a friend to start chatting."
              />
            ) : (
              friendIds.map((id) => (
                <button
                  className={selectedFriend === id ? "active" : ""}
                  key={id}
                  onClick={() => openChat(id)}
                >
                  <Avatar person={profiles[id]} />
                  <PersonName person={profiles[id]} />
                </button>
              ))
            )}
          </Section>
          <Section title="Conversation" className="chat-panel">
            {!selectedPerson ? (
              <Empty
                headline="Choose a friend"
                text="Select a conversation to begin."
              />
            ) : (
              <>
                <div className="chat-heading">
                  <Avatar person={selectedPerson} />
                  <PersonName person={selectedPerson} />
                </div>
                <div className="chat-messages" aria-live="polite">
                  {!messages.length && (
                    <p className="muted">
                      Say hello to start the conversation.
                    </p>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`chat-bubble ${message.sender_id === user.id ? "mine" : ""}`}
                    >
                      <p>{message.body}</p>
                      <time dateTime={message.created_at}>
                        {friendlyTime(message.created_at)}
                      </time>
                    </div>
                  ))}
                </div>
                <div className="chat-compose">
                  <label className="sr-only" htmlFor="chat-message">
                    Message {selectedPerson.display_name}
                  </label>
                  <textarea
                    id="chat-message"
                    value={messageBody}
                    maxLength={2000}
                    rows={2}
                    placeholder="Write a message…"
                    onChange={(event) => setMessageBody(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    className="primary"
                    aria-label="Send message"
                    disabled={!messageBody.trim()}
                    onClick={sendMessage}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </Section>
        </div>
      )}

      {view === "Groups" && (
        <div className="social-columns">
          <Section title="Create a private group">
            <label className="field">
              <span>Group name</span>
              <input
                value={groupName}
                maxLength={60}
                onChange={(event) => setGroupName(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                value={groupDescription}
                maxLength={500}
                onChange={(event) => setGroupDescription(event.target.value)}
              />
            </label>
            <button
              className="primary"
              disabled={busy || groupName.trim().length < 2}
              onClick={createGroup}
            >
              <Users size={17} /> Create group
            </button>
          </Section>
          <Section title="Your groups">
            {!groups.length ? (
              <Empty
                headline="No groups yet"
                text="Create a private space for your friends."
              />
            ) : (
              groups.map((group) => (
                <button
                  className={`group-row ${selectedGroup === group.id ? "active" : ""}`}
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group.id);
                    setView("Feed");
                  }}
                >
                  <span className="group-icon">
                    <Users size={19} />
                  </span>
                  <span>
                    <strong>{group.name}</strong>
                    <small>{group.description || "Private group"}</small>
                  </span>
                </button>
              ))
            )}
          </Section>
          {groups
            .filter((group) => group.owner_id === user.id)
            .map((group) => (
              <Section key={group.id} title={`Add friends to ${group.name}`}>
                {!friendIds.length ? (
                  <p className="muted">
                    Add friends before inviting group members.
                  </p>
                ) : (
                  friendIds.map((id) => (
                    <div className="person-row" key={id}>
                      <Avatar person={profiles[id]} />
                      <PersonName person={profiles[id]} />
                      <button
                        className="secondary"
                        onClick={() => addGroupMember(group.id, id)}
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </Section>
            ))}
        </div>
      )}
    </>
  );
}

function Avatar({ person }: { person?: Profile }) {
  return (
    <span className="social-avatar" aria-hidden="true">
      {(person?.display_name || "M").slice(0, 1).toUpperCase()}
    </span>
  );
}

function PersonName({ person }: { person?: Profile }) {
  return (
    <span className="person-name">
      <strong>{person?.display_name || "Member"}</strong>
      <small>@{person?.username || "member"}</small>
    </span>
  );
}

function PeopleList({
  people,
  action,
}: {
  people: Profile[];
  friendships: Friendship[];
  userId: string;
  action: (person: Profile) => React.ReactNode;
}) {
  if (!people.length)
    return (
      <p className="muted social-hint">
        Search by a friend’s name or username.
      </p>
    );
  return people.map((person) => (
    <div className="person-row" key={person.user_id}>
      <Avatar person={person} />
      <PersonName person={person} />
      {action(person)}
    </div>
  ));
}

function PostList({
  posts,
  profiles,
  comments,
  reactions,
  userId,
  drafts,
  setDrafts,
  react,
  addComment,
  share,
  report,
}: {
  posts: Post[];
  profiles: Record<string, Profile>;
  comments: Comment[];
  reactions: Reaction[];
  userId: string;
  drafts: Record<string, string>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  react: (postId: string, kind?: Reaction["kind"]) => void;
  addComment: (postId: string) => void;
  share: (postId: string) => void;
  report: (postId: string) => void;
}) {
  if (!posts.length)
    return (
      <Section title="Feed">
        <Empty
          headline="Your feed is ready"
          text="Your posts and friends’ updates will appear here."
        />
      </Section>
    );
  const postMap = Object.fromEntries(posts.map((post) => [post.id, post]));
  return (
    <div className="social-feed">
      {posts.map((post) => {
        const postComments = comments.filter((c) => c.post_id === post.id);
        const postReactions = reactions.filter((r) => r.post_id === post.id);
        const mine = postReactions.find((r) => r.user_id === userId);
        const original = post.shared_post_id
          ? postMap[post.shared_post_id]
          : null;
        return (
          <article className="social-post panel" key={post.id}>
            <header>
              <Avatar person={profiles[post.author_id]} />
              <PersonName person={profiles[post.author_id]} />
              <time dateTime={post.created_at}>
                {friendlyTime(post.created_at)}
              </time>
              {post.author_id !== userId && (
                <button
                  className="icon-btn"
                  aria-label="Report post"
                  title="Report post"
                  onClick={() => report(post.id)}
                >
                  <MoreHorizontal size={18} />
                </button>
              )}
            </header>
            {post.body && <p className="post-body">{post.body}</p>}
            {post.shared_post_id && (
              <div className="shared-post">
                <Share2 size={15} />
                <strong>Shared post</strong>
                <p>{original?.body || "A post from their network"}</p>
              </div>
            )}
            <div className="post-summary">
              <span>{postReactions.length} reactions</span>
              <span>{postComments.length} comments</span>
            </div>
            <div className="post-actions">
              <button
                className={mine ? "active" : ""}
                onClick={() => react(post.id)}
              >
                <Heart size={17} fill={mine ? "currentColor" : "none"} /> Like
              </button>
              <button onClick={() => share(post.id)}>
                <Share2 size={17} /> Share
              </button>
            </div>
            {!!postComments.length && (
              <div className="post-comments">
                {postComments.map((comment) => (
                  <div className="comment" key={comment.id}>
                    <Avatar person={profiles[comment.author_id]} />
                    <div>
                      <strong>
                        {profiles[comment.author_id]?.display_name || "Member"}
                      </strong>
                      <p>{comment.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="comment-compose">
              <label className="sr-only" htmlFor={`comment-${post.id}`}>
                Write a comment
              </label>
              <input
                id={`comment-${post.id}`}
                value={drafts[post.id] || ""}
                maxLength={2000}
                placeholder="Write a comment…"
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [post.id]: event.target.value,
                  }))
                }
                onKeyDown={(event) =>
                  event.key === "Enter" && addComment(post.id)
                }
              />
              <button
                className="icon-btn"
                aria-label="Post comment"
                disabled={!drafts[post.id]?.trim()}
                onClick={() => addComment(post.id)}
              >
                <Send size={17} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
