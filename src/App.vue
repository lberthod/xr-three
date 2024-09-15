<template>
  <div>
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/admin">Admin</router-link>
      <router-link to="/mobile-experience">Mobile Experience</router-link> <!-- New Link -->
    </nav>
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
nav {
  margin: 20px;
  text-align: center;
}

nav a {
  margin: 0 15px;
  text-decoration: none;
  color: #42b983;
}

nav a.router-link-exact-active {
  font-weight: bold;
}
</style>
