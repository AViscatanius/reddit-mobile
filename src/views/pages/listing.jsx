import React from 'react';

import q from 'q';

import commentsMap from '../../lib/commentsMap';

import LoadingFactory from '../components/Loading';
var Loading;

import ListingFactory from '../components/Listing';
var Listing;

import CommentBoxFactory from '../components/CommentBox';
var CommentBox;

import CommentFactory from '../components/Comment';
var Comment;

import TopNavFactory from '../components/TopNav';
var TopNav;

import TopSubnavFactory from '../components/TopSubnav';
var TopSubnav;

class ListingPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      comments: props.comments,
      listing: props.listing,
    };
  }

  componentDidMount () {
    ListingPage.populateData(this.props.api, this.props, true).done((function(data) {
      this.setState({
        listing: data.listing,
        comments: data.comments,
      });
    }).bind(this));

    this.props.app.emit(TopNav.SUBREDDIT_NAME, this.props.subredditName);
  }

  onNewComment (comment) {
    this.state.comments.splice(0, 0, comment);
    this.setState({ comments: this.props.comments });
  }

  render () {
    var loading;

    if (this.state.listing === undefined) {
      loading = (
        <Loading />
      );
    }

    var listing = this.state.listing || {};
    var comments = this.state.comments || [];
    var api = this.props.api;
    var user = this.props.user;
    var token = this.props.token;

    var author = listing.author;
    var listingElement;
    var commentBoxElement;

    var sort = this.props.sort || 'best';
    var app=this.props.app;

    if (!loading) {
      listingElement = (
        <Listing 
          app={ app } 
          listing={ listing } 
          single={ true } 
          user={ user } 
          token={ token } 
          api={ api } 
          expanded={ true } 
          titleLink={ listing.url }
          showWholeImage={true} />
      );

      commentBoxElement = (
        <CommentBox
          thingId={ listing.name }
          user={ user }
          token={ token }
          api={ api }
          csrf={ this.props.csrf }
          onSubmit={ this.onNewComment }
        />
      );
    }

    return (
      <main className='listing-main'>
        { loading }
        <TopSubnav app={ app } user={ user } sort={ sort } list='comments' baseUrl={ this.props.url }/>
        <div className='container' key='container'>
          { listingElement }
          { commentBoxElement }
          {
            comments.map(function(comment, i) {
              if (comment) {
                comment = commentsMap(comment, null, author, 4, 0);
                return (
                  <Comment
                    app={app}
                    comment={comment}
                    index={i}
                    key={`page-comment-${comment.name}`}
                    nestingLevel={ 0 }
                    op={ author }
                    user={ user }
                    token={ token }
                    api={api}
                  />
                );
              }
            })
          }
        </div>
      </main>
    );
  }

  static populateData (api, props, synchronous) {
    var defer = q.defer();

    // Only used for server-side rendering. Client-side, call when
    // componentedMounted instead.
    if (!synchronous) {
      defer.resolve();
      return defer.promise;
    }

    var options = api.buildOptions(props.token);

    function decodeHtmlEntities(html){
      return html.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
    }

    function mapComment(comment) {
      if (comment && comment.body) {
        comment.body_html = decodeHtmlEntities(comment.body_html);

        if (comment.replies){
          comment.replies = comment.replies.map(mapComment) || [];
        }

        return comment;
      }
    }

    options.linkId = props.listingId;
    options.sort = props.sort || 'confidence';

    // Initialized with data already.
    if (typeof props.comments !== 'undefined') {
      api.hydrate('comments', options, {
        listing: props.listings,
        comments: props.comments,
      });

      defer.resolve(props);
      return defer.promise;
    }


    api.comments.get(options).done(function(data){
      data.comments = data.comments.map(function(comment){
        return mapComment(comment);
      });

      defer.resolve(data);
    });

    return defer.promise;
  }
};

function ListingPageFactory(app) {
  Loading = LoadingFactory(app);
  Listing = ListingFactory(app);
  Comment = CommentFactory(app);
  CommentBox = CommentBoxFactory(app);
  TopNav = TopNavFactory(app);
  TopSubnav = TopSubnavFactory(app);

  return app.mutate('core/pages/listing', ListingPage);
}

export default ListingPageFactory;
