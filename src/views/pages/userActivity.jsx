import React from 'react';
import q from 'q';
import querystring from 'querystring';

import LoadingFactory from '../components/Loading';
var Loading;

import ListingFactory from '../components/Listing';
var Listing;

import CommentPreviewFactory from '../components/CommentPreview';
var CommentPreview;

import TopNavFactory from '../components/TopNav';
var TopNav;

import UserActivitySubnavFactory from '../components/UserActivitySubnav';
var UserActivitySubnav;

import UserProfileNavFactory from '../components/UserProfileNav';
var UserProfileNav;

class UserActivityPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activities: props.activities,
    };
  }

  componentDidMount () {
    UserActivityPage.populateData(this.props.api, this.props, true).done((function(data) {
      this.setState({
        activities: data.activities,
      });
    }).bind(this));

    this.props.app.emit(TopNav.SUBREDDIT_NAME, this.props.userName);
  }

  render () {
    var loading;

    if (this.state.activities === undefined) {
      loading = (
        <Loading />
      );
    }

    var page = this.props.page || 0;
    var api = this.props.api;
    var token = this.props.token;
    var user = this.props.user;

    var activities = this.state.activities || [];

    var subreddit = '';

    if (this.props.subredditName) {
      subreddit = '/r/' + this.props.subredditName;
    }

    var sort = this.props.sort || 'hot';

    var app = this.props.app;

    var userProfile = this.props.userProfile || {};
    var name = this.props.userName;

    return (
      <main>
        { loading }
        <UserProfileNav userName={ name } activityActive={ true } />
        <UserActivitySubnav app={ app } sort={ sort } name={ name } activity={ this.props.activity }/>

        <div className='container listing-container'>
          {
            activities.map(function(thing, i) {
              var index = (page * 25) + i;

              if (thing._type === 'Link') {
                return (
                  <Listing
                    app={app}
                    listing={thing}
                    index={index}
                    key={'page-listing-' + index}
                    page={page}
                    hideSubredditLabel={false}
                    user={user}
                    token={token}
                    api={api}
                    hideUser={ true }
                  />
                );
              } else if (thing._type === 'Comment') {
                return (
                  <CommentPreview
                    comment={thing}
                    key={'page-comment-' + index}
                    page={page}
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
    options.activity = props.activity || 'comments';

    if (props.after) {
      options.query.after = props.after;
    }

    if (props.before) {
      options.query.before = props.before;
    }

    if (props.sort) {
      options.query.sort = props.sort;
    }

    options.user = props.userName;

    // Initialized with data already.
    if (typeof props.activities !== 'undefined') {
      defer.resolve(props);
      return defer.promise;
    }

    api.activities.get(options).then(function(data) {
      defer.resolve({
        activities: data,
      });
    }, function(error) {
      defer.reject(error);
    });

    return defer.promise;
  }
}

function UserActivityPageFactory(app) {
  Listing = ListingFactory(app);
  Loading = LoadingFactory(app);
  TopNav = TopNavFactory(app);
  UserActivitySubnav = UserActivitySubnavFactory(app);
  UserProfileNav = UserProfileNavFactory(app);
  CommentPreview = CommentPreviewFactory(app);

  return app.mutate('core/pages/userActivity', UserActivityPage);
}

export default UserActivityPageFactory;
