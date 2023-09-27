import { initializeApp } from "firebase/app";
import {
  getFirestore,
  getDocs,
  collection,
  addDoc,
  doc,
  serverTimestamp,
  setDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  collectionGroup,
  getDoc,
  persistentLocalCache,
  persistentMultipleTabManager,
  persistentSingleTabManager,
  initializeFirestore,
} from "firebase/firestore";

import {
  getAuth,
  signInWithRedirect,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  linkWithRedirect,
} from "firebase/auth";
import {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
  deleteObject,
  uploadBytes,
} from "firebase/storage";
import { MDCDialog } from "@material/dialog";

const firebaseConfig = {
  apiKey: "AIzaSyD2mbYGbjafiv5ikZ0Piyk7VSsxKMIsNhs",
  authDomain: "fir-demo-57641.firebaseapp.com",
  projectId: "fir-demo-57641",
  storageBucket: "fir-demo-57641.appspot.com",
  messagingSenderId: "983995023140",
  appId: "1:983995023140:web:e886c7f2b5121bad353db1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// initialisai=tion db
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Enreigistrement user
const newUser = ({ email, uid }) => {
  const userRef = doc(db, "utilisateurs", uid);
  setDoc(userRef, { email, uid }, { merge: true });
};

// Auth
// Selectionner le formulaire de connexion
const gmailLogin = document.querySelector("#googlebtn");
const login = document.querySelector("#login");
const user_email = document.querySelector("#user_email");
const userNavbar = document.querySelector("#user");
userNavbar.style.display = "none";

gmailLogin.addEventListener("click", () => {
  signInWithRedirect(auth, new GoogleAuthProvider());
});

const dialog = document.querySelector("dialog");

// const addBtn = document.querySelector(".addBtn");
// addBtn.addEventListener("click", () => {
//   dialog.showModal();
//   dialog.style.display = "flex";
// });

let cityUrlImg = "";

// Ajouter une ville
const setCityForm = (docCityID, dialog) => {
  const AddForm = document.querySelector(".addForm");
  AddForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newDocID = String(AddForm.ville.value)
      .toLocaleLowerCase()
      .replace(/\s+/g, "");
    const cityID = docCityID === "nouvelle-ville" ? newDocID : docCityID;
    const user = auth.currentUser;
    const usersCityRef = `utilisateurs/${user.uid}/villes`;
    const userCityDocRef = doc(db, usersCityRef, cityID);

    const pays = AddForm.pays.value;
    const ville = AddForm.ville.value;
    const population = Number(AddForm.population.value);
    const capital = AddForm.capitale.value === "true" ? true : false;

    setDoc(userCityDocRef, {
      cityID,
      pays,
      ville,
      population,
      capital,
      dateDajout: serverTimestamp(),
      cityUrlImg,
      user: {
        email: user.email,
        uid: user.uid,
      },
    });

    AddForm.reset();
    dialog.style.display = "none";

    if (docCityID === "nouvelle-ville") dialog.close();
  });
};

setCityForm("nouvelle-ville", dialog);

const closeBtn = document.querySelector(".close-dialog");
closeBtn.addEventListener("click", () => {
  dialog.close();
  document.querySelector(".addForm").reset();
  dialog.style.display = "none";
});

// Fonction pour uploader sur storage
const uploadToStorageImage = async (file) => {
  const filePath = `images/${Date.now()}`;
  const pathReference = ref(storage, filePath);
  const uploadTask = await uploadBytes(pathReference, file);
  window.localStorage.setItem("pathReference", uploadTask.ref.fullPath);

  return await getDownloadURL(uploadTask.ref);
};

// Suppresion de l'image
const deleteImgToStorage = async () => {
  const pathReference = window.localStorage.getItem("pathReference");
  const imgRef = ref(storage, pathReference);
  // window.localStorage.removeItem("pathReference");
  return await deleteObject(imgRef);
};

// Uploader une image
const uploader = document.querySelector(".img-input");

const imgPreview = document.querySelector(".preview-img");
console.log(imgPreview);
const submitBtn = document.querySelector(".submitBtn");

uploader.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  submitBtn.disabled = true;
  const reader = new FileReader();

  reader.readAsDataURL(file);
  reader.onloadend = () => {
    // setting the uploaded image to the imgPreview src
    imgPreview.src = reader.result;
    imgPreview.style.width = "70%";
  };

  try {
    if (cityUrlImg) await deleteImgToStorage();
    cityUrlImg = await uploadToStorageImage(file);
    submitBtn.disabled = false;
    console.log(cityUrlImg);
  } catch (error) {
    console.log(error.message);
  }
});

// Formater la date
const getFormatedDate = (date) => {
  const formatedDate = new Intl.DateTimeFormat("fr").format(
    date ? date.toDate() : new Date()
  );
  return formatedDate;
};

// Observation des changements dans la collection villes en temps réel
const citiesList = document.querySelector(".city-item-container");
let ville = [];

const citiesRef = collectionGroup(db, "villes");

onSnapshot(citiesRef, (snapshot) => {
  ville = snapshot.docs.map((doc) => doc.data());
  let cities = "";
  ville.forEach((ville) => {
    cities += `<a class="city-card mdc-card mdc-card--outlined" href="detail.html?data=${
      ville.cityID
    }" style="opacity: ${ville.isOffLine === true ? "0.5" : "1"}">
      
  <img src="${ville.cityUrlImg}" alt="" class="city-img" />
 

      <h1 class="city-title">${ville.ville}</h1>
            <h4 class="city-country">${
              ville.capital === true ? "La capitale de " : "Pays: "
            } ${ville.pays}</h4>
            <p class="city-population">Population: ${ville.population}</p>
            <p class="city-publisher">Postée par ${
              ville.user?.uid === auth.currentUser.uid
                ? "vous"
                : ville.user?.email
            }
            </p>
            <p class="city-population">Ajoutée le : ${getFormatedDate(
              ville.dateDajout
            )}</p>
            <button class="btn-remove">Effacer</button>
      </a>`;
  });

  citiesList.innerHTML = cities;
});

if (
  !window.location.search.replace("?data=", "") ||
  location.href.includes("?apiKey=")
) {
  // Connexion avec google
  const signInGoogleBtn = document.querySelector(".googleLogin");
  signInGoogleBtn.addEventListener("click", () => {
    signInWithRedirect(auth, new GoogleAuthProvider());
  });

  // Authentification sans password mais avec lien
  const passwordlessForm = document.querySelector(".passwordless");
  passwordlessForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = passwordlessForm.email.value;
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };
    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        window.localStorage.setItem("emailForSign", email);
        passwordlessForm.reset();
      })
      .catch((err) => {
        console.log(err.message);
      });
  });

  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = localStorage.getItem("emailForSign");

    if (!email) {
      email = window.prompt("Veuillez saisir votre adresse mail");
    }

    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        console.log("Connectez-vous avec succès");
        window.localStorage.removeItem("emailForSign");

        // lier
        linkWithRedirect(auth.currentUser, new GoogleAuthProvider());
      })
      .catch((err) => {
        console.log(err.message);
      });
  }
} else {
  alert("Vous devez vous connecter pour accéder à cette page");
}
// Le changement d'etat de l'interface (connexion/deconnexion)
const isLogInToolBar = document.querySelector(".isLogIn-toolbar");
const isLogInHome = document.querySelector(".isLogIn-home");
const isLogOut = document.querySelector(".isLogOut");
// isLogInToolBar.style.display = "none";
isLogInHome.style.display = "none";
isLogOut.style.display = "none";

console.log(isLogInToolBar, isLogOut, isLogInHome);

// Savoir si on est à la page detail
const isDetailPage = window.location.pathname.includes("detail.html");
console.log(isDetailPage);

if (isDetailPage) {
  // avoir le data de la ville par l'url
  const cityId = window.location.search.replace("?data=", "");
  console.log(cityId);
  if (isDetailPage) window.localStorage.setItem("cityID", cityId);
}

console.log(window.location.search.replace("?data=", ""));
//Effacer un document
const deteCityDoc = (userID) => {
  const cityIdInStore = window.localStorage.getItem("cityID");
  if (cityIdInStore) {
    const usersCityRef = `utilisateurs/${userID}/villes`;
    deleteDoc(doc(db, usersCityRef, cityIdInStore));
    window.localStorage.removeItem("cityID");
  }
};

// Page de details
// const cityId = window.location.replace("?data=", "");
// const queryDoc = query(citiesRef, where("cityId", "==", cityId));

// onSnapshot(queryDoc, (snapshot) => {
//   const ville = snapshot.docs.map((d) => d.data());
//   const cityItemContainer = document.querySelector(".city-card");
// });

// Avoir l'etat de user connecter
const userEmail = document.querySelector(".current-user");
// subscription à l'état de la connexion utilisateur

// user state
onAuthStateChanged(auth, async (user) => {
  console.log(user);
  if (user) {
    console.log(user);
    userNavbar.style.display = "flex";
    login.classList.add("hidden");
    isLogInToolBar.style.display = "block";
    isLogInHome.style.display = "";
    userEmail.textContent = `${user.email}`;
  } else {
    userNavbar.style.display = "none";
    login.classList.remove("hidden");
    isLogInToolBar.style.display = "none";
    isLogInHome.style.display = "none";
    isLogOut.style.display = "";
    console.log("user is not logged in to retrive data");
  }
});
// Deconnexion user

const logoutBtn = document.querySelector(".logoutBtn");

logoutBtn.addEventListener("click", () => {
  signOut(auth);
});
